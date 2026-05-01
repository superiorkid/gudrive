from fastapi import APIRouter

from app.api.v1 import auth, uploads

api_router = APIRouter()

api_router.include_router(uploads.uploads_router_v1, prefix="/uploads")
api_router.include_router(auth.auth_router_v1, prefix="/auth")
