from datetime import UTC, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Node, StarredNode, User
from app.models.node import NodeType
from app.services.cache import CacheService


async def get_statistics_service(
    db: AsyncSession, current_user: User, cache: CacheService
):
    cache_key = f"statistics:user={current_user.id}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    seven_days_ago = datetime.now(UTC) - timedelta(days=7)

    base_filters = [
        Node.owner_id == current_user.id,
        Node.type == NodeType.FILE,
    ]

    statistics_query = select(
        func.count(Node.id).label("total_files"),
        func.coalesce(func.sum(Node.size), 0).label("library_size"),
        func.count(case((Node.created_at >= seven_days_ago, 1))).label(
            "recent_uploads"
        ),
        func.count(
            case(
                (
                    Node.mime_type.like("image/%"),
                    1,
                )
            )
        ).label("images"),
        func.count(
            case(
                (
                    Node.mime_type.like("video/%"),
                    1,
                )
            )
        ).label("videos"),
        func.count(
            case(
                (
                    (
                        Node.mime_type.like("application/%")
                        | Node.mime_type.like("text/%")
                    ),
                    1,
                )
            )
        ).label("documents"),
    ).where(*base_filters)

    result = await db.execute(statistics_query)
    stats = result.one()

    starred_query = select(func.count(StarredNode.user_id)).where(
        StarredNode.user_id == current_user.id
    )
    starred_result = await db.execute(starred_query)
    starred_items = starred_result.scalar() or 0
    known_types = stats.images + stats.videos + stats.documents
    audio_other = stats.total_files - known_types

    data = {
        "total_files": stats.total_files,
        "library_size": stats.library_size,
        "recent_uploads": stats.recent_uploads,
        "starred_items": starred_items,
        "types": {
            "images": stats.images,
            "videos": stats.videos,
            "documents": stats.documents,
            "audio_other": max(audio_other, 0),
        },
    }

    await cache.set(
        cache_key,
        data,
        ttl=60 * 5,
    )

    return data
