from fastapi import FastAPI

from app.api import api_router
from app.common.error_handlers import setup_exception_handlers


def create_application() -> FastAPI:
    application = FastAPI(
        title="FastAPI resumable uploads file",
        version="1.0.0",
    )
    setup_exception_handlers(application)

    application.include_router(api_router, prefix="/api/v1")

    return application


app = create_application()
