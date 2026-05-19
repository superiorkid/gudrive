import uuid
from typing import Optional

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload

from app.common.exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from app.lib.is_descendant import is_descendant
from app.models.node import Node, NodeType
from app.models.starred_node import StarredNode
from app.models.user import User
from app.schemas.node import CreateNodeSchema, UpdateNodeSchema
from app.services.cache import CacheService
from app.services.node_query import (
    apply_file_filter,
    apply_modified_filter,
    apply_sort,
    apply_status_filter,
    normalize_sort,
)


async def create_node_service(
    payload: CreateNodeSchema, db: AsyncSession, current_user: User, cache: CacheService
):
    name = payload.name.strip()
    if not name:
        raise BadRequestException("Folder name is required", details={})

    if payload.parent_id:
        query = select(Node).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()

        if not parent:
            raise NotFoundException("Node", str(payload.parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent.type}
            )

    # prevent duplicate name in same folder
    query = select(Node).where(
        Node.parent_id == payload.parent_id,
        Node.owner_id == current_user.id,
        Node.name == name,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        raise AlreadyExistsException("Node", "name", name)

    node = Node(
        name=name,
        type=NodeType.FOLDER,
        parent_id=payload.parent_id,
        owner_id=current_user.id,
        mime_type="inode/directory",
        size=None,
        storage_path=None,
    )

    db.add(node)
    await db.commit()
    await db.refresh(node)

    # invalidate folder listing
    await cache.flush_pattern(
        f"nodes:user={current_user.id}:parent={payload.parent_id}:*"
    )
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")
    # invalidate parent detail cache
    if payload.parent_id:
        await cache.delete(
            f"node:detail:user={current_user.id}:node={payload.parent_id}"
        )

    return node


async def get_nodes_service(
    db: AsyncSession,
    current_user: User,
    cache: CacheService,
    parent_id: Optional[uuid.UUID],
    type: Optional[str],
    modified: Optional[str],
    sort_by: Optional[str],
    sort_direction: Optional[str],
    folder_group: Optional[str],
    status: Optional[str],
    keyword: Optional[str],
    scope: Optional[str],
):
    status = status if status else "active"

    cache_key = (
        f"nodes:"
        f"user={current_user.id}:"
        f"parent={parent_id}:"
        f"type={type}:"
        f"modified={modified}:"
        f"sort_by={sort_by}:"
        f"sort_direction={sort_direction}:"
        f"folder_group={folder_group}:"
        f"status={status}:"
        f"keyword={keyword}:"
        f"scope={scope}"
    )

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    if parent_id:
        parent_query = select(Node).where(
            Node.id == parent_id,
            Node.owner_id == current_user.id,
        )

        result = await db.execute(parent_query)
        parent = result.scalar_one_or_none()

        if not parent:
            raise NotFoundException("Node", str(parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder",
                details={"parent_type": parent.type},
            )

    if status == "trashed":
        Parent = aliased(Node)

        query = (
            select(Node)
            .outerjoin(Parent, Node.parent_id == Parent.id)
            .where(
                Node.owner_id == current_user.id,
                Node.deleted_at.is_not(None),
                or_(
                    Node.parent_id.is_(None),
                    Parent.deleted_at.is_(None),
                ),
            )
        )
    else:
        query = select(Node).where(
            Node.owner_id == current_user.id,
        )

    if scope == "starred":
        query = query.join(StarredNode, StarredNode.node_id == Node.id).where(
            StarredNode.user_id == current_user.id
        )

    if scope != "starred":
        if not keyword:
            query = query.where(Node.parent_id == parent_id)
        elif parent_id:
            query = query.where(Node.parent_id == parent_id)

    query = query.options(joinedload(Node.parent))

    query = apply_status_filter(query, status)

    if type:
        query = apply_file_filter(query=query, type=type)

    if modified:
        query = apply_modified_filter(query=query, modified=modified)

    if keyword:
        ts_query = func.websearch_to_tsquery("simple", keyword)

        query = query.where(
            or_(
                Node.search_vector.op("@@")(ts_query),
                Node.name.op("%")(keyword),
                Node.name.ilike(f"%{keyword}%"),
            )
        )

        query = query.order_by(
            func.ts_rank(Node.search_vector, ts_query).desc(),
            func.similarity(Node.name, keyword).desc(),
            func.lower(Node.name).asc(),
        )
    else:
        sort_by, sort_direction, folder_group = normalize_sort(
            sort_by=sort_by or "",
            sort_direction=sort_direction or "",
            folder_group=folder_group or "",
        )

        query = apply_sort(
            query,
            sort_by,
            sort_direction,
            folder_group,
            type,
            status,
        )

    is_starred_subquery = (
        select(1)
        .select_from(StarredNode)
        .where(
            StarredNode.user_id == current_user.id,
            StarredNode.node_id == Node.id,
        )
        .correlate(Node)
        .exists()
    )

    query = query.add_columns(is_starred_subquery.label("is_starred"))

    result = await db.execute(query)
    rows = result.all()

    data = [
        {
            "id": str(node.id),
            "name": node.name,
            "type": node.type.value,
            "parent_id": node.parent_id,
            "parent": (
                {
                    "id": str(node.parent.id),
                    "name": node.parent.name,
                    "type": node.parent.type.value,
                }
                if node.parent
                else None
            ),
            "size": node.size,
            "mime_type": node.mime_type,
            "preview_url": node.preview_url,
            "preview_status": node.preview_status,
            "is_starred": is_starred,
            "created_at": node.created_at,
            "updated_at": node.updated_at,
            "deleted_at": node.deleted_at,
        }
        for node, is_starred in rows
    ]

    ttl = 15 if keyword else 60
    await cache.set(
        cache_key,
        data,
        ttl=ttl * 60 * 60,
    )

    return data


async def detail_node_service(
    node_id: uuid.UUID, db: AsyncSession, current_user: User, cache: CacheService
):
    cache_key = f"node:detail:" f"user={current_user.id}:" f"node={node_id}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    query = select(Node).where(
        Node.id == node_id,
        Node.owner_id == current_user.id,
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    response = {
        "id": str(node.id),
        "name": node.name,
        "type": node.type.value,
        "parent_id": node.parent_id,
        "mime_type": node.mime_type,
        "size": node.size,
        "preview_url": node.preview_url,
        "preview_status": node.preview_status,
        "created_at": node.created_at,
        "updated_at": node.updated_at,
    }

    if node.type == NodeType.FOLDER:
        count_result = await db.execute(
            select(func.count()).where(
                Node.parent_id == node.id,
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
        )
        children_count = count_result.scalar_one()

        response["children_count"] = children_count

    await cache.set(
        cache_key,
        response,
        ttl=300 * 60 * 60,
    )

    return response


async def update_node_service(
    db: AsyncSession,
    current_user: User,
    node_id: uuid.UUID,
    payload: UpdateNodeSchema,
    cache: CacheService,
):
    query = select(Node).where(
        Node.id == node_id,
        Node.owner_id == current_user.id,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    new_name = node.name
    if payload.name is not None:
        new_name = payload.name.strip()
        if not new_name:
            raise BadRequestException(
                "Name cannot be empty", details={"new_name": payload.name}
            )

    new_parent_id = (
        payload.parent_id if payload.parent_id is not None else node.parent_id
    )
    if payload.parent_id is not None:
        if payload.parent_id == node.id:
            raise BadRequestException(
                "Cannot move node into itself",
                details={"new_parent_id": payload.parent_id},
            )

        # preventing moving to descendant
        is_invalid = await is_descendant(
            db=db, node_id=node_id, target_id=payload.parent_id
        )
        if is_invalid:
            raise BadRequestException("Cannot move a folder into its own subfolder")

        query = select(Node).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()

        if not parent:
            raise NotFoundException("Node", str(payload.parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Target must be a folder", details={"parent_type": parent.type}
            )

    query = select(Node).where(
        Node.parent_id == new_parent_id,
        Node.owner_id == current_user.id,
        Node.name == new_name,
        Node.id != node.id,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        raise AlreadyExistsException("Node", "name", new_name)

    old_parent_id = node.parent_id
    node.name = new_name
    node.parent_id = new_parent_id

    await db.commit()
    await db.refresh(node)

    await cache.flush_pattern(f"node:detail:user={current_user.id}:node={node_id}")
    # invalidate old folder
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={old_parent_id}:*")
    if old_parent_id != new_parent_id:
        # invalidate new folder
        await cache.flush_pattern(
            f"nodes:user={current_user.id}:parent={new_parent_id}:*"
        )
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:keyword=*")

    return node


async def delete_node_service(
    db: AsyncSession, current_user: User, node_id: uuid.UUID, cache: CacheService
):
    query = select(Node).where(
        Node.id == node_id, Node.owner_id == current_user.id, Node.deleted_at.is_(None)
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    parent_id = node.parent_id

    descendants_cte = (
        select(Node.id)
        .where(Node.id == node_id)
        .cte(name="descendants", recursive=True)
    )
    descendants_alias = descendants_cte.alias()
    descendants_cte = descendants_cte.union_all(
        select(Node.id).where(Node.parent_id == descendants_alias.c.id)
    )
    await db.execute(
        update(Node)
        .where(Node.id.in_(select(descendants_cte.c.id)))
        .values(deleted_at=func.now())
    )
    await db.commit()

    # invalidate folder listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={parent_id}:*")
    # invalidate trash listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:*status=trashed*")
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")
    # invalidate node detail
    await cache.delete(f"node:detail:user={current_user.id}:node={node_id}")
    # invalidate parent detail (children_count changed)
    if parent_id:
        await cache.delete(f"node:detail:user={current_user.id}:node={parent_id}")

    return {
        "success": True,
    }


async def restore_node_service(
    db: AsyncSession, current_user: User, node_id: uuid.UUID, cache: CacheService
):
    query = select(Node).where(
        Node.id == node_id,
        Node.owner_id == current_user.id,
        Node.deleted_at.is_not(None),
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    parent_id = node.parent_id

    if parent_id:
        query = select(Node).where(
            Node.id == node.parent_id, Node.owner_id == current_user.id
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()

        if not parent or parent.deleted_at is not None:
            raise BadRequestException(
                "Cannot restore: parent folder no longer exists or is deleted"
            )

    query = select(Node).where(
        Node.parent_id == node.parent_id,
        Node.owner_id == current_user.id,
        Node.name == node.name,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    conflict = result.scalar_one_or_none()

    if conflict:
        raise AlreadyExistsException("Node", "name", node.name)

    # recursive restore
    descendants_cte = (
        select(Node.id)
        .where(Node.id == node.id)
        .cte(name="descendants", recursive=True)
    )
    descendants_alias = descendants_cte.alias()
    descendants_cte = descendants_cte.union_all(
        select(Node.id).where(Node.parent_id == descendants_alias.c.id)
    )

    # fetch descendant ids for cache invalidation
    descendant_ids_result = await db.execute(select(descendants_cte.c.id))
    descendant_ids = descendant_ids_result.scalars().all()

    await db.execute(
        update(Node)
        .where(Node.id.in_(select(descendants_cte.c.id)))
        .values(deleted_at=None)
    )
    await db.commit()

    # invalidate folder listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={parent_id}:*")
    # invalidate trash listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:*status=trashed*")
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")
    # invalidate restored node details
    for descendant_id in descendant_ids:
        await cache.delete(f"node:detail:user={current_user.id}:node={descendant_id}")
    # invalidate parent detail (children_count changed)
    if parent_id:
        await cache.delete(f"node:detail:user={current_user.id}:node={parent_id}")

    return {"success": True}


async def toggle_star_service(
    db: AsyncSession,
    current_user: User,
    node_id: uuid.UUID,
    cache: CacheService,
):
    query = select(Node).where(
        Node.id == node_id,
        Node.owner_id == current_user.id,
        Node.deleted_at.is_(None),
    )

    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    query = select(StarredNode).where(
        StarredNode.user_id == current_user.id,
        StarredNode.node_id == node_id,
    )

    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    is_starred = False

    if existing:
        await db.execute(
            delete(StarredNode).where(
                StarredNode.user_id == current_user.id,
                StarredNode.node_id == node_id,
            )
        )

        is_starred = False

    else:
        db.add(
            StarredNode(
                user_id=current_user.id,
                node_id=node_id,
            )
        )

        is_starred = True

    try:
        await db.commit()

    except IntegrityError:
        await db.rollback()

        raise AlreadyExistsException(
            "StarredNode",
            "node_id",
            str(node_id),
        )

    # invalidate starred listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:*scope=starred*")
    # invalidate folder listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={node.parent_id}:*")
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")
    # invalidate node detail
    await cache.delete(f"node:detail:user={current_user.id}:node={node_id}")

    return {
        "node_id": str(node_id),
        "is_starred": is_starred,
    }
