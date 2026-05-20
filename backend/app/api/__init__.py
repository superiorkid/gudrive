from fastapi import APIRouter

from app.api.v1 import auth, nodes, stats, tasks, uploads

api_router = APIRouter()

api_router.include_router(uploads.uploads_router_v1, prefix="/uploads")
api_router.include_router(auth.auth_router_v1, prefix="/auth")
api_router.include_router(nodes.nodes_router_v1, prefix="/nodes")
api_router.include_router(tasks.tasks_router_v1, prefix="/tasks")
api_router.include_router(stats.statistics_router_v1, prefix="/statistics")
