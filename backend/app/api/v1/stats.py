from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_cache, get_current_active_user
from app.lib.success_response import success_response
from app.models import User
from app.schemas.statistics import StatisticsResponse
from app.services.cache import CacheService
from app.services.stat import get_statistics_service

statistics_router_v1 = APIRouter(tags=["Statistics"])


@statistics_router_v1.get("/overview")
async def get_statistics(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    cache: CacheService = Depends(get_cache),
):
    statistics = await get_statistics_service(
        db=db, current_user=current_user, cache=cache
    )
    return success_response(statistics)
