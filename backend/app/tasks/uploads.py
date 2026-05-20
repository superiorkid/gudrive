from celery.signals import worker_process_init
from sqlalchemy import select

from app.core.async_runner import run_async
from app.core.celery import celery_app
from app.core.redis import redis_client
from app.database import async_session_maker
from app.services.file_processor.registry import get_processor


@worker_process_init.connect
def init_worker(**kwargs):
    import asyncio

    asyncio.run(redis_client.connect())


@celery_app.task(name="generate_file_preview")
def generate_file_preview(node_id: str):
    return run_async(_generate_file_preview(node_id))


async def _generate_file_preview(node_id: str):
    import app.models
    from app.core.config import get_configs
    from app.core.redis import redis_client
    from app.models.node import Node, PreviewStatus
    from app.services.cache import CacheService

    config = get_configs()

    redis = await redis_client.client
    cache = CacheService(redis)

    async with async_session_maker() as db:
        node = None

        try:
            result = await db.execute(select(Node).where(Node.id == node_id))
            node = result.scalar_one_or_none()
            if not node:
                return {
                    "status": "error",
                    "message": "node was not found",
                }

            node.preview_status = PreviewStatus.PROCESSING
            await db.commit()
            await cache.delete(f"node:detail:user={node.owner_id}:node={node.id}")
            await cache.flush_pattern(
                f"nodes:user={node.owner_id}:parent={node.parent_id}:*"
            )

            print(
                f"DEBUG: Processing node {node.id} "
                f"with mime_type: '{node.mime_type}'"
            )

            processor = get_processor(node.mime_type or "unknown")
            if not processor:
                node.preview_status = PreviewStatus.FAILED
                await db.commit()
                await cache.delete(f"node:detail:user={node.owner_id}:node={node.id}")
                await cache.flush_pattern(
                    f"nodes:user={node.owner_id}:parent={node.parent_id}:*"
                )

                return {
                    "status": "skipped",
                    "reason": "unsupported type",
                }

            output_path = f"{config.upload_thumbnail_dir}/{node.id}.jpg"

            process_result = processor.process(
                node.storage_path,
                output_path,
            )

            # success state
            node.preview_url = process_result.get("preview_path")
            node.preview_status = PreviewStatus.READY

            await db.commit()

            await cache.delete(f"node:detail:user={node.owner_id}:node={node.id}")
            await cache.flush_pattern(
                f"nodes:user={node.owner_id}:parent={node.parent_id}:*"
            )
            return {"status": "success"}

        except Exception as e:
            await db.rollback()

            if node:
                try:
                    node.preview_status = PreviewStatus.FAILED

                    await db.commit()

                    # invalidate failed state
                    await cache.delete(
                        f"node:detail:user={node.owner_id}:node={node.id}"
                    )

                    await cache.flush_pattern(
                        f"nodes:user={node.owner_id}:parent={node.parent_id}:*"
                    )

                except Exception as nested_e:
                    print(f"Failed to set error state: {nested_e}")

            return {
                "status": "error",
                "message": str(e),
            }
