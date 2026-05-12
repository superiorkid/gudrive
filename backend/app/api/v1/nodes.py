import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.models.user import User
from app.schemas.node import CreateNodeSchema, UpdateNodeSchema
from app.services.node import (
    create_node_service,
    delete_node_service,
    detail_node_service,
    get_nodes_service,
    restore_node_service,
    update_node_service,
)
from app.utils.success_response import success_response

nodes_router_v1 = APIRouter(tags=["Nodes"])


@nodes_router_v1.post("/")
async def create_node(
    payload: CreateNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
):
    result = await create_node_service(payload, db, current_user)
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "type": result.type.value,
            "parent_id": result.parent_id,
            "created_at": result.created_at,
        }
    )


@nodes_router_v1.get("/")
async def get_nodes(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    parent_id: Optional[uuid.UUID] = None,
    type: Optional[str] = None,
    modified: Optional[str] = None,
    sort_by: Optional[str] = "name",
    sort_direction: Optional[str] = "asc",
    folder_group: Optional[str] = "top",
    status: Optional[str] = "active",  # "active" | "trashed"
):
    result = await get_nodes_service(
        current_user=current_user,
        db=db,
        parent_id=parent_id,
        type=type,
        modified=modified,
        sort_by=sort_by,
        sort_direction=sort_direction,
        folder_group=folder_group,
        status=status,
    )
    return success_response(data=result)


@nodes_router_v1.get("/{node_id}")
async def detail_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
):
    result = await detail_node_service(node_id, db, current_user)
    return success_response(data=result)


@nodes_router_v1.put("/{node_id}")
async def update_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    payload: UpdateNodeSchema,
):

    result = await update_node_service(db, current_user, node_id, payload)
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "parent_id": result.parent_id,
            "type": result.type.value,
        }
    )


@nodes_router_v1.delete("/{node_id}")
async def delete_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
):
    await delete_node_service(db, current_user, node_id)
    return success_response(data={"ok": True})


@nodes_router_v1.post("/{node_id}/restore")
async def restore_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
):
    await restore_node_service(db, current_user, node_id)
    return success_response(data={"ok": True})
