import uuid
from typing import Optional

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload

from app.common.exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from app.models.node import Node, NodeType
from app.models.user import User
from app.schemas.node import CreateNodeSchema, UpdateNodeSchema
from app.services.node_query import (
    apply_file_filter,
    apply_modified_filter,
    apply_sort,
    apply_status_filter,
    normalize_sort,
)
from app.utils.is_descendant import is_descendant


async def create_node_service(
    payload: CreateNodeSchema, db: AsyncSession, current_user: User
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

    return node


async def get_nodes_service(
    db: AsyncSession,
    current_user: User,
    parent_id: Optional[uuid.UUID],
    type: Optional[str],
    modified: Optional[str],
    sort_by: Optional[str],
    sort_direction: Optional[str],
    folder_group: Optional[str],
    status: Optional[str],
):
    status = status if status else "active"

    if parent_id:
        query = select(Node).where(
            Node.id == parent_id,
            Node.owner_id == current_user.id,
        )
        # query = apply_status_filter(query, status)
        result = await db.execute(query)
        parent = result.scalar_one_or_none()

        if not parent:
            raise NotFoundException("Node", str(parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent.type}
            )

    if status == "trashed":
        Parent = aliased(Node)

        query = (
            select(Node)
            .outerjoin(Parent, Node.parent_id == Parent.id)
            .where(
                Node.owner_id == current_user.id,
                Node.deleted_at.is_not(None),
                or_(Node.parent_id.is_(None), Parent.deleted_at.is_(None)),
            )
        )
    else:
        query = select(Node).where(
            Node.owner_id == current_user.id,
            Node.parent_id == parent_id,
        )

    query = query.options(joinedload(Node.parent))
    query = apply_status_filter(query, status)

    if type:
        query = apply_file_filter(query=query, type=type)

    if modified:
        query = apply_modified_filter(query=query, modified=modified)

    sort_by, sort_direction, folder_group = normalize_sort(
        sort_by=sort_by if sort_by else "",
        sort_direction=sort_direction if sort_direction else "",
        folder_group=folder_group if folder_group else "",
    )

    query = apply_sort(query, sort_by, sort_direction, folder_group, type, status)

    result = await db.execute(query)
    nodes = result.scalars().all()

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
            "created_at": node.created_at,
            "updated_at": node.updated_at,
            "deleted_at": node.deleted_at,
        }
        for node in nodes
    ]

    return data


async def detail_node_service(
    node_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
):
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

    return response


async def update_node_service(
    db: AsyncSession, current_user: User, node_id: uuid.UUID, payload: UpdateNodeSchema
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
        if payload.parent_id == new_parent_id:
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

    node.name = new_name
    node.parent_id = new_parent_id

    await db.commit()
    await db.refresh(node)


async def delete_node_service(db: AsyncSession, current_user: User, node_id: uuid.UUID):
    query = select(Node).where(
        Node.id == node_id, Node.owner_id == current_user.id, Node.deleted_at.is_(None)
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

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


async def restore_node_service(
    db: AsyncSession, current_user: User, node_id: uuid.UUID
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

    if node.parent_id:
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

    await db.execute(
        update(Node)
        .where(Node.id.in_(select(descendants_cte.c.id)))
        .values(deleted_at=None)
    )
    await db.commit()
