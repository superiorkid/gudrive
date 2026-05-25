import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_async_db_session,
    get_cache,
    get_current_active_user,
    rate_limit,
)
from app.core.config import Settings, get_configs
from app.lib.success_response import success_response
from app.models.user import User
from app.schemas.node import (
    CopyNodeSchema,
    CreateNodeSchema,
    MoveNodeSchema,
    RenameNodeSchema,
    UpdateNodeSchema,
)
from app.services.cache import CacheService
from app.services.node import (
    copy_node_service,
    create_node_service,
    cut_node_service,
    delete_node_service,
    detail_node_service,
    force_delete_service,
    get_nodes_service,
    rename_node_service,
    restore_node_service,
    toggle_star_service,
    update_node_service,
)

nodes_router_v1 = APIRouter(tags=["Nodes"])


@nodes_router_v1.post("/", dependencies=[Depends(rate_limit(limit=30, window=60))])
async def create_node(
    payload: CreateNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
):
    result = await create_node_service(
        payload=payload, db=db, current_user=current_user, cache=cache
    )
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "type": result.type.value,
            "parent_id": result.parent_id,
            "created_at": result.created_at,
        }
    )


@nodes_router_v1.get("/", dependencies=[Depends(rate_limit(limit=120, window=60))])
async def get_nodes(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
    parent_id: Optional[uuid.UUID] = None,
    type: Optional[str] = None,
    modified: Optional[str] = None,
    sort_by: Optional[str] = "name",
    sort_direction: Optional[str] = "asc",
    folder_group: Optional[str] = "top",
    status: Optional[str] = "active",  # "active" | "trashed"
    keyword: Optional[str] = None,
    scope: Optional[str] = None,  # "starred" | "normal" | etc.
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
        keyword=keyword,
        scope=scope,
        cache=cache,
    )
    return success_response(data=result)


@nodes_router_v1.get(
    "/{node_id}", dependencies=[Depends(rate_limit(limit=200, window=60))]
)
async def detail_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    cache: CacheService = Depends(get_cache),
):
    result = await detail_node_service(
        node_id=node_id, db=db, current_user=current_user, cache=cache
    )
    return success_response(data=result)


@nodes_router_v1.put(
    "/{node_id}", dependencies=[Depends(rate_limit(limit=60, window=60))]
)
async def update_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    payload: UpdateNodeSchema,
    cache: CacheService = Depends(get_cache),
):
    result = await update_node_service(
        db=db, current_user=current_user, node_id=node_id, payload=payload, cache=cache
    )
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "parent_id": result.parent_id,
            "type": result.type.value,
        }
    )


@nodes_router_v1.delete(
    "/{node_id}", dependencies=[Depends(rate_limit(limit=20, window=60))]
)
async def delete_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    cache: CacheService = Depends(get_cache),
):
    await delete_node_service(
        db=db, current_user=current_user, node_id=node_id, cache=cache
    )
    return success_response(data={"ok": True})


@nodes_router_v1.patch("/{node_id}/rename")
async def rename_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    payload: RenameNodeSchema,
    cache: CacheService = Depends(get_cache),
):
    result = await rename_node_service(
        db=db, current_user=current_user, node_id=node_id, payload=payload, cache=cache
    )
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "parent_id": result.parent_id,
            "type": result.type.value,
        }
    )


@nodes_router_v1.post("/{node_id}/move")
async def cut_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    payload: MoveNodeSchema,
    cache: CacheService = Depends(get_cache),
):
    result = await cut_node_service(
        db=db, current_user=current_user, node_id=node_id, payload=payload, cache=cache
    )
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "parent_id": result.parent_id,
            "type": result.type.value,
        }
    )


@nodes_router_v1.post("/{node_id}/copy")
async def copy_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    payload: CopyNodeSchema,
    cache: CacheService = Depends(get_cache),
):
    result = await copy_node_service(
        db=db, current_user=current_user, node_id=node_id, payload=payload, cache=cache
    )
    return success_response(
        data={
            "id": str(result.id),
            "name": result.name,
            "parent_id": result.parent_id,
            "type": result.type.value,
        }
    )


@nodes_router_v1.post(
    "/{node_id}/restore", dependencies=[Depends(rate_limit(limit=20, window=60))]
)
async def restore_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    cache: CacheService = Depends(get_cache),
):
    await restore_node_service(
        db=db, current_user=current_user, node_id=node_id, cache=cache
    )
    return success_response(data={"ok": True})


@nodes_router_v1.post(
    "/{node_id}/starred", dependencies=[Depends(rate_limit(limit=100, window=60))]
)
async def toggle_star(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    node_id: uuid.UUID,
    cache: CacheService = Depends(get_cache),
):
    result = await toggle_star_service(
        db=db, current_user=current_user, node_id=node_id, cache=cache
    )
    return success_response(data=result)


@nodes_router_v1.delete("/{node_id}/force")
async def force_delete(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
    node_id: uuid.UUID,
    cache: CacheService = Depends(get_cache),
):
    result = await force_delete_service(
        current_user=current_user, db=db, node_id=node_id, cache=cache
    )
    return success_response(data=result)
