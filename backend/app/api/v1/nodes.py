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
from app.lib.success_response import success_response
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
    page: Optional[int] = 1,
    limit: Optional[int] = 25,
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
        page=page,
        limit=limit,
    )
    return success_response(data=result)


@nodes_router_v1.post("/move", dependencies=[Depends(rate_limit(limit=40, window=60))])
async def cut_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    payload: MoveNodeSchema,
    cache: CacheService = Depends(get_cache),
):
    await cut_node_service(
        db=db, current_user=current_user, payload=payload, cache=cache
    )
    return success_response(data={"success": True})


@nodes_router_v1.post("/copy", dependencies=[Depends(rate_limit(limit=20, window=60))])
async def copy_node(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    payload: CopyNodeSchema,
    cache: CacheService = Depends(get_cache),
):
    await copy_node_service(
        db=db, current_user=current_user, payload=payload, cache=cache
    )
    return success_response(data={"success": True})


@nodes_router_v1.delete(
    "/bulk-delete", dependencies=[Depends(rate_limit(limit=20, window=60))]
)
async def delete_node(
    payload: BulkDeleteNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
):
    await delete_node_service(
        payload=payload, db=db, current_user=current_user, cache=cache
    )
    return success_response(data={"ok": True})


@nodes_router_v1.delete(
    "/bulk-force-delete", dependencies=[Depends(rate_limit(limit=15, window=60))]
)
async def force_delete(
    payload: BulkForceDeleteNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
):
    result = await force_delete_service(
        current_user=current_user, db=db, payload=payload, cache=cache
    )
    return success_response(data=result)


@nodes_router_v1.post(
    "/bulk-restore", dependencies=[Depends(rate_limit(limit=20, window=60))]
)
async def restore_node(
    payload: BulkRestoreNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
):
    await restore_node_service(
        db=db, current_user=current_user, payload=payload, cache=cache
    )
    return success_response(data={"ok": True})


@nodes_router_v1.post(
    "/bulk-starred", dependencies=[Depends(rate_limit(limit=100, window=60))]
)
async def toggle_star(
    payload: BulkToggleStarNodeSchema,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
):
    result = await toggle_star_service(
        db=db, current_user=current_user, payload=payload, cache=cache
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


@nodes_router_v1.patch(
    "/{node_id}/rename", dependencies=[Depends(rate_limit(limit=60, window=60))]
)
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
