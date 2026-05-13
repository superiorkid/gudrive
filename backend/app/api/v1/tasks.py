from fastapi import APIRouter

from app.core.celery import celery_app
from app.utils.success_response import success_response

tasks_router_v1 = APIRouter(tags=["Background Task"])


@tasks_router_v1.get("/{task_id}")
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)
    return success_response(
        data={
            "task_id": task_id,
            "status": result.status,  # PENDING, STARTED, SUCCESS, FAILURE
            "result": result.result if result.ready() else None,
        }
    )


@tasks_router_v1.post("/{task_id}/cancel")
async def cancel_task(task_id: str):
    celery_app.control.revoke(task_id, terminate=True)
    return success_response(data={"task_id": task_id, "status": "REVOKED"})


@tasks_router_v1.post("/{task_id}/retry")
async def retry_task(task_id: str):
    result = celery_app.AsyncResult(task_id)
    if result.status != "FAILURE":
        return success_response(message="Task is not failure.")

    result.retry()
    return success_response(data={"task_id": task_id, "status": "RETRYING"})
