from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.common.error_handlers import setup_exception_handlers
from app.core.redis import lifespan
from app.middlewares.cors import cors_middleware


def create_application() -> FastAPI:
    application = FastAPI(
        title="FastAPI resumable uploads file", version="1.0.0", lifespan=lifespan
    )
    setup_exception_handlers(application)
    cors_middleware(application)

    application.mount(
        "/data/thumbnails", StaticFiles(directory="data/thumbnails"), name="thumbnails"
    )

    application.include_router(api_router, prefix="/api/v1")

    return application


app = create_application()
