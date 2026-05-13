import asyncio

from sqlalchemy import select

from app.core.async_runner import run_async
from app.core.celery import celery_app
from app.database import async_session_maker
from app.services.file_processor.registry import get_processor


@celery_app.task(name="generate_file_preview")
def generate_file_preview(node_id: str):
    return run_async(_generate_file_preview(node_id))


async def _generate_file_preview(node_id: str):
    import app.models
    from app.models.node import Node, PreviewStatus

    async with async_session_maker() as db:
        node = None
        try:
            result = await db.execute(select(Node).where(Node.id == node_id))
            node = result.scalar_one_or_none()

            if not node:
                return {"status": "error", "message": "node was not found"}

            node.preview_status = PreviewStatus.PROCESSING
            await db.commit()

            processor = get_processor(node.mime_type or "unknown")
            if not processor:
                node.preview_status = PreviewStatus.FAILED
                await db.commit()
                return {"status": "skipped", "reason": "unsupported type"}

            output_path = f"thumbnails/{node.id}.jpg"
            process_result = processor.process(node.storage_path, output_path)

            node.preview_url = process_result.get("preview_path")
            node.preview_status = PreviewStatus.READY
            await db.commit()
            return {"status": "success"}

        except Exception as e:
            await db.rollback()

            if node:
                try:
                    node.preview_status = PreviewStatus.FAILED
                    await db.commit()
                except Exception as nested_e:
                    print(f"Failed to set error state: {nested_e}")

            return {"status": "error", "message": str(e)}


# TODO: others file type
