from fastapi import APIRouter

from app.api.v1 import uploads

api_router = APIRouter()

api_router.include_router(uploads.uploads_router_v1, prefix="/uploads")
