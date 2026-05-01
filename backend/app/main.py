from fastapi import FastAPI

from app.api import api_router


def create_application() -> FastAPI:
    application = FastAPI(
        title="FastAPI resumable uploads file",
        version="1.0.0",
    )

    application.include_router(api_router, prefix="/api/v1")

    return application


app = create_application()
