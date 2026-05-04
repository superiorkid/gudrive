import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import asc, case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.common.exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from app.models.node import Node, NodeType
from app.models.user import User
from app.schemas.node import CreateNodeSchema, UpdateNodeSchema
from app.utils.is_descendant import is_descendant
from app.utils.success_response import success_response

nodes_router_v1 = APIRouter(tags=["Nodes"])


@nodes_router_v1.post("/")
async def create_node(
    payload: CreateNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
):
    name = payload.name.strip()
    if not name:
        raise BadRequestException("message", details={})

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

    return success_response(
        data={
            "id": str(node.id),
            "name": node.name,
            "type": node.type.value,
            "parent_id": node.parent_id,
            "created_at": node.created_at,
        }
    )


@nodes_router_v1.get("/")
async def get_nodes(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    parent_id: Optional[uuid.UUID] = None,
):
    if parent_id:
        query = select(Node).where(
            Node.id == parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()
        if not parent:
            raise NotFoundException("Node", str(parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent.type}
            )

    query = (
        select(Node)
        .where(
            Node.owner_id == current_user.id,
            Node.parent_id == parent_id,
            Node.deleted_at.is_(None),
        )
        .order_by(case((Node.type == NodeType.FOLDER, 0), else_=1), asc(Node.name))
    )
    result = await db.execute(query)
    nodes = result.scalars().all()
    data = [
        {
            "id": str(node.id),
            "name": node.name,
            "type": node.type.value,
            "parent_id": node.parent_id,
            "size": node.size,
            "mime_type": node.mime_type,
            "created_at": node.created_at,
        }
        for node in nodes
    ]

    return success_response(data=data)


@nodes_router_v1.get("/{node_id}")
async def detail_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
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

    response = {
        "id": str(node.id),
        "name": node.name,
        "type": node.type.value,
        "parent_id": node.parent_id,
        "mime_type": node.mime_type,
        "size": node.size,
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

    return success_response(data=response)


@nodes_router_v1.put("/{node_id}")
async def update_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    payload: UpdateNodeSchema,
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

    return success_response(
        data={
            "id": str(node.id),
            "name": node.name,
            "parent_id": node.parent_id,
            "type": node.type.value,
        }
    )


@nodes_router_v1.delete("/{node_id}")
async def delete_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
):
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
    return success_response(data={"ok": True})


@nodes_router_v1.post("/{node_id}/restore")
async def restore_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
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
    await db.execute(select(Node.id).where(Node.id.in_(select(descendants_cte.c.id))))
    await db.commit()
    return success_response(data={"ok": True})
