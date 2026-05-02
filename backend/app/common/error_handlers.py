import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.common.exceptions import AppException

logger = logging.getLogger("app.errors")


def setup_exception_handlers(app: FastAPI):
    """Register all exception handlers on the app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle all custom application exceptions."""
        logger.warning(
            f"{exc.error_code}: {exc.message} | " f"{request.method} {request.url.path}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Transform Pydantic validation errors into our format."""
        errors = {}
        for error in exc.errors():
            # Extract the field name from the location tuple
            # loc looks like ("body", "shipping_address", "postal_code")
            field_path = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
            errors[field_path] = error["msg"]

        logger.info(
            f"Validation error: {errors} | " f"{request.method} {request.url.path}"
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error_code": "VALIDATION_ERROR",
                "message": "Please fix the following errors",
                "details": errors,
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle FastAPI/Starlette HTTP exceptions."""
        error_map = {
            401: ("UNAUTHORIZED", "Authentication required"),
            403: ("FORBIDDEN", "Access denied"),
            404: ("NOT_FOUND", f"Resource not found: {request.url.path}"),
            405: (
                "METHOD_NOT_ALLOWED",
                f"{request.method} is not allowed on this endpoint",
            ),
        }

        error_code, default_msg = error_map.get(
            exc.status_code, ("HTTP_ERROR", str(exc.detail))
        )

        message = str(exc.detail) if exc.detail != error_code else default_msg

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": error_code,
                "message": message,
                "details": None,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """Catch-all for any unhandled exceptions."""
        logger.error(
            f"Unhandled exception: {type(exc).__name__}: {exc} | "
            f"{request.method} {request.url.path}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error_code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
                "details": None,
            },
        )
