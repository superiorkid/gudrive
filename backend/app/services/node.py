import asyncio
import logging
import os
import uuid
from math import ceil
from pathlib import Path
from types import CoroutineType
from typing import Any, Optional

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload

from app.common.exceptions import (
    AlreadyExistsException,
    AppException,
    BadRequestException,
    NotFoundException,
)
from app.lib.copy_node_recursive import copy_node_recursive
from app.lib.generate_unique_filename import generate_unique_filename
from app.lib.is_descendant import is_descendant
from app.models import UploadSession
from app.models.node import Node, NodeType
from app.models.starred_node import StarredNode
from app.models.user import User
from app.schemas.node import (
    BulkDeleteNodeSchema,
    BulkForceDeleteNodeSchema,
    BulkRestoreNodeSchema,
    BulkToggleStarNodeSchema,
    CopyNodeSchema,
    CreateNodeSchema,
    MoveNodeSchema,
    RenameNodeSchema,
    UpdateNodeSchema,
)
from app.services.cache import CacheService
from app.services.node_query import (
    apply_file_filter,
    apply_modified_filter,
    apply_sort,
    apply_status_filter,
    normalize_sort,
)

logger = logging.getLogger(__name__)


async def create_node_service(
    payload: CreateNodeSchema, db: AsyncSession, current_user: User, cache: CacheService
):
    name = payload.name

    if payload.parent_id is not None:
        query = select(Node.type).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent_type = result.scalar_one_or_none()

        if parent_type is None:
            raise NotFoundException("Node", str(payload.parent_id))

        if parent_type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent_type}
            )

    node = Node(
        name=name,
        type=NodeType.FOLDER,
        parent_id=payload.parent_id,
        owner_id=current_user.id,
        mime_type="inode/directory",
    )

    db.add(node)

    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        if "uq_node_name_per_parent" in str(e.orig):
            raise AlreadyExistsException("Node", "name", name) from e

    await db.refresh(node, ["created_at", "updated_at", "preview_status"])

    invalidation_tasks: list[CoroutineType[Any, Any, Any]] = [
        cache.flush_pattern(
            f"nodes:user={current_user.id}:parent={payload.parent_id}:*"
        ),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]

    if payload.parent_id is not None:
        invalidation_tasks.append(
            cache.delete(f"node:detail:user={current_user.id}:node={payload.parent_id}")
        )

    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

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
    page: Optional[int],
    limit: Optional[int],
):
    status = status if status else "active"
    page = max(page or 1, 1)
    limit = min(max(limit or 25, 1), 100)

    offset = (page - 1) * limit

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
        f"scope={scope}:"
        f"page={page}:"
        f"limit={limit}"
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
        query = query.join(
            StarredNode,
            StarredNode.node_id == Node.id,
        ).where(StarredNode.user_id == current_user.id)

    if status != "trashed":
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

    #
    # COUNT QUERY
    #
    count_subquery = query.order_by(None).subquery()

    total_query = select(func.count()).select_from(count_subquery)

    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0

    #
    # PAGINATION
    #
    query = query.offset(offset).limit(limit)

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

    response = {
        "items": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": ceil(total / limit) if total > 0 else 1,
            "has_next_page": page * limit < total,
            "has_prev_page": page > 1,
        },
    }

    ttl = 15 if keyword else 60

    await cache.set(
        cache_key,
        response,
        ttl=ttl * 60 * 60,
    )

    return response


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
                details={"new_parent_id": str(payload.parent_id)},
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
    payload: BulkDeleteNodeSchema,
    db: AsyncSession,
    current_user: User,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"success": True}

    result = await db.execute(
        select(Node).where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )
    nodes = result.scalars().all()

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    parent_ids = {node.parent_id for node in nodes}

    descendants_cte = (
        select(Node.id)
        .where(Node.id.in_(payload.node_ids))
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

    # Invalidate old parent folder layout counts
    for p_id in parent_ids:
        await cache.flush_pattern(f"nodes:user={current_user.id}:parent={p_id}:*")
        if p_id:
            await cache.delete(f"node:detail:user={current_user.id}:node={p_id}")

    # Invalidate individual details for the targeted parent nodes
    for nid in payload.node_ids:
        await cache.delete(f"node:detail:user={current_user.id}:node={nid}")

    # Invalidate global trash grid layouts and search results
    await cache.flush_pattern(f"nodes:user={current_user.id}:*status=trashed*")
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")

    return {"success": True}


async def restore_node_service(
    payload: BulkRestoreNodeSchema,
    db: AsyncSession,
    current_user: User,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"success": True}

    result = await db.execute(
        select(Node).where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_not(None),
        )
    )
    nodes = result.scalars().all()

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    parent_ids = {node.parent_id for node in nodes}
    non_root_parent_ids = [p_id for p_id in parent_ids if p_id is not None]
    if non_root_parent_ids:
        parent_result = await db.execute(
            select(Node).where(
                Node.id.in_(non_root_parent_ids), Node.owner_id == current_user.id
            )
        )
        parents = {p.id: p for p in parent_result.scalars().all()}

        for node in nodes:
            if node.parent_id is not None:
                parent = parents.get(node.parent_id)
                if not parent or parent.deleted_at is not None:
                    raise BadRequestException(
                        f"Cannot restore '{node.name}': parent folder no longer exists or is deleted"
                    )

    conflict_conditions = [
        (Node.parent_id == node.parent_id) & (Node.name == node.name) for node in nodes
    ]
    conflict_result = await db.execute(
        select(Node).where(
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
            or_(*conflict_conditions),
        )
    )
    conflict_node = conflict_result.scalar_one_or_none()
    if conflict_node:
        raise AlreadyExistsException("Node", "name", conflict_node.name)

    descendants_cte = (
        select(Node.id)
        .where(Node.id.in_(payload.node_ids))
        .cte(name="descendants", recursive=True)
    )
    descendants_alias = descendants_cte.alias()
    descendants_cte = descendants_cte.union_all(
        select(Node.id).where(Node.parent_id == descendants_alias.c.id)
    )
    descendants_ids_result = await db.execute(select(descendants_cte.c.id))
    descendant_ids = descendants_ids_result.scalars().all()

    await db.execute(
        update(Node).where(Node.id.in_(descendant_ids)).values(deleted_at=None)
    )
    await db.commit()

    # Clear directory layout index pools for affected scopes
    for p_id in parent_ids:
        await cache.flush_pattern(f"nodes:user={current_user.id}:parent={p_id}:*")
        if p_id:
            await cache.delete(f"node:detail:user={current_user.id}:node={p_id}")

    # Evict detailed definitions for all processed child records
    for d_id in descendant_ids:
        await cache.delete(f"node:detail:user={current_user.id}:node={d_id}")

    # Wipe trash boards and global keyword indexes
    await cache.flush_pattern(f"nodes:user={current_user.id}:*status=trashed*")
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")

    return {"success": True}


async def toggle_star_service(
    db: AsyncSession,
    current_user: User,
    payload: BulkToggleStarNodeSchema,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"node_ids": [], "is_starred": False}

    result = await db.execute(
        select(Node).where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )
    nodes = result.scalars().all()

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    parent_ids = {node.parent_id for node in nodes}
    starred_result = await db.execute(
        select(StarredNode.node_id).where(
            StarredNode.user_id == current_user.id,
            StarredNode.node_id.in_(payload.node_ids),
        )
    )
    already_starred_ids = set(starred_result.scalars().all())

    has_unstarred_items = len(already_starred_ids) < len(payload.node_ids)
    target_star_state = True if has_unstarred_items else False

    if target_star_state:
        # star
        nodes_to_star = [
            nid for nid in payload.node_ids if nid not in already_starred_ids
        ]
        for nid in nodes_to_star:
            db.add(StarredNode(user_id=current_user.id, node_id=nid))
    else:
        # unstar
        await db.execute(
            delete(StarredNode).where(
                StarredNode.user_id == current_user.id,
                StarredNode.node_id.in_(payload.node_ids),
            )
        )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise BadRequestException(
            "A transaction conflict occurred while updating star statuses."
        )

    # Optimized Batch Cache Invalidation Operations
    await cache.delete(f"statistics:user={current_user.id}")
    # Invalidate starred pages views
    await cache.flush_pattern(f"nodes:user={current_user.id}:*scope=starred*")
    # Invalidate search keywords cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")
    # Invalidate parent listings folders affected by item metadata state adjustments
    for p_id in parent_ids:
        await cache.flush_pattern(f"nodes:user={current_user.id}:parent={p_id}:*")
    # Invalidate node entry details records specifically targeting items changed
    for nid in payload.node_ids:
        await cache.delete(f"node:detail:user={current_user.id}:node={nid}")

    return {
        "node_ids": [str(nid) for nid in payload.node_ids],
        "is_starred": target_star_state,
    }


async def force_delete_service(
    current_user: User,
    db: AsyncSession,
    payload: BulkForceDeleteNodeSchema,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"deleted": 0, "node_ids": []}

    result = await db.execute(
        select(Node).where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_not(None),
        )
    )
    root_nodes = result.scalars().all()

    if len(root_nodes) != len(payload.node_ids):
        found_ids = {n.id for n in root_nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s) in Trash", ", ".join(missing_ids))

    nodes_to_delete: list[Node] = list(root_nodes)

    folder_ids = [node.id for node in root_nodes if node.type == NodeType.FOLDER]
    if folder_ids:
        descendants_cte = (
            select(Node)
            .where(Node.parent_id.in_(folder_ids), Node.owner_id == current_user.id)
            .cte(name="descendants", recursive=True)
        )
        descendants_alias = descendants_cte.alias()
        descendants_cte = descendants_cte.union_all(
            select(Node).where(
                Node.parent_id == descendants_alias.c.id,
                Node.owner_id == current_user.id,
            )
        )
        descendants_result = await db.execute(
            select(Node).join(descendants_cte, Node.id == descendants_cte.c.id)
        )
        descendants = descendants_result.scalars().all()
        nodes_to_delete.extend(descendants)

    for item in nodes_to_delete:
        if item.type != NodeType.FILE:
            continue

        if item.storage_path:
            try:
                if os.path.exists(item.storage_path):
                    os.remove(item.storage_path)
            except OSError as e:
                raise AppException(
                    error_code="FILE_DELETE_FAILED",
                    message=f"Failed to delete file from storage: {str(e)}",
                    details={
                        "node_id": str(item.id),
                        "path": item.storage_path,
                    },
                )

        if item.preview_url:
            try:
                if os.path.exists(item.preview_url):
                    os.remove(item.preview_url)
            except OSError:
                pass

    all_deleted_ids = [item.id for item in nodes_to_delete]

    await db.execute(
        delete(UploadSession).where(UploadSession.parent_id.in_(all_deleted_ids))
    )
    await db.execute(delete(Node).where(Node.id.in_(all_deleted_ids)))
    await db.commit()

    await cache.delete(f"statistics:user={current_user.id}")
    await cache.flush_pattern(f"nodes:user={current_user.id}:*")
    await cache.flush_pattern(f"node:detail:user={current_user.id}:*")

    return {
        "deleted": len(nodes_to_delete),
        "node_ids": [str(nid) for nid in payload.node_ids],
    }


async def rename_node_service(
    db: AsyncSession,
    current_user: User,
    node_id: uuid.UUID,
    payload: RenameNodeSchema,
    cache: CacheService,
):
    result = await db.execute(
        select(Node).where(
            Node.id == node_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )
    node = result.scalar_one_or_none()
    if not node:
        raise NotFoundException("Node", str(node_id))

    new_name = payload.new_name.strip()
    if not new_name:
        raise BadRequestException(
            "Name cannot be empty",
            details={"new_name": payload.new_name},
        )

    if new_name == node.name:
        return {"success": True}

    if node.type == NodeType.FILE:
        old_suffix = Path(node.name).suffix
        new_suffix = Path(new_name).suffix

        if not new_suffix and old_suffix:
            new_name = f"{new_name}{old_suffix}"

    resolved_name = await generate_unique_filename(
        db=db, owner_id=current_user.id, parent_id=node.parent_id, filename=new_name
    )
    node.name = resolved_name

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AlreadyExistsException(
            "Node",
            "name",
            resolved_name,
        )

    await db.refresh(node)
    # invalidate detail cache
    await cache.delete(f"node:detail:user={current_user.id}:node={node.id}")
    # invalidate folder listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={node.parent_id}:*")
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")

    return {"success": True}


async def cut_node_service(
    db: AsyncSession,
    current_user: User,
    payload: MoveNodeSchema,
    cache: CacheService,
):
    target_parent_id = payload.parent_id
    result = await db.execute(
        select(Node).where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )
    nodes = result.scalars().all()

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    if target_parent_id is not None:
        parent_result = await db.execute(
            select(Node).where(
                Node.id == target_parent_id,
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise NotFoundException("Parent Node", str(target_parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Target must be a folder",
                details={"target_type": parent.type},
            )

    old_parent_ids = set()
    updated_nodes = []

    for node in nodes:
        # skip if already in the target parent folder
        if target_parent_id == node.parent_id:
            updated_nodes.append(node)
            continue

        # prevent moving folder into itself
        if target_parent_id == node.id:
            raise BadRequestException(
                "Cannot move node into itself",
                details={"target_parent_id": str(target_parent_id)},
            )

        # prevent moving a folder into its own descendants
        if target_parent_id is not None:
            is_invalid = await is_descendant(
                db=db, node_id=node.id, target_id=target_parent_id
            )
            if is_invalid:
                raise BadRequestException(
                    f"Cannot move folder '{node.name}' into its own descendant"
                )

        resolved_name = await generate_unique_filename(
            db=db,
            owner_id=current_user.id,
            parent_id=target_parent_id,
            filename=node.name,
        )
        old_parent_ids.add(node.parent_id)

        node.parent_id = target_parent_id
        node.name = resolved_name
        updated_nodes.append(node)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AlreadyExistsException(
            "Node",
            "name",
            "Conflict encountered during bulk move operation.",
        )

    for node in updated_nodes:
        await db.refresh(node)

    # Invalidate individual node details
    for node in updated_nodes:
        await cache.delete(f"node:detail:user={current_user.id}:node={node.id}")

    # Invalidate old folder listings
    for old_pid in old_parent_ids:
        await cache.flush_pattern(f"nodes:user={current_user.id}:parent={old_pid}:*")

    # Invalidate new target folder listing
    await cache.flush_pattern(
        f"nodes:user={current_user.id}:parent={target_parent_id}:*"
    )

    # Invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")

    return updated_nodes


async def copy_node_service(
    db: AsyncSession,
    current_user: User,
    payload: CopyNodeSchema,
    cache: CacheService,
):
    target_parent_id = payload.parent_id
    result = await db.execute(
        select(Node).where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )
    nodes = result.scalars().all()

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    if target_parent_id is not None:
        parent_result = await db.execute(
            select(Node).where(
                Node.id == target_parent_id,
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise NotFoundException("Node", str(target_parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Target must be a folder",
                details={"target_type": parent.type},
            )

    copied_nodes = []
    for node in nodes:
        copied_node = await copy_node_recursive(
            db=db,
            current_user=current_user,
            node=node,
            target_parent_id=target_parent_id,
        )
        copied_nodes.append(copied_node)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AlreadyExistsException(
            "Node",
            "name",
            "Conflict encountered during bulk copy operation.",
        )

    for copied_node in copied_nodes:
        await db.refresh(copied_node)

    # Invalidate only the destination folder's layout cache (since old folders are untouched)
    await cache.flush_pattern(
        f"nodes:user={current_user.id}:parent={target_parent_id}:*"
    )
    # Invalidate global search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")

    return copied_nodes
