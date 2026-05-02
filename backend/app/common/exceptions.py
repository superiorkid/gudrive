from fastapi import status


class AppException(Exception):
    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = 500,
        details: dict | list | None = None,
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            error_code="NOT_FOUND",
            message=f"{resource} with id {identifier} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class AlreadyExistsException(AppException):
    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            error_code="ALREADY_EXISTS",
            message=f"{resource} with {field} '{value}' already exists",
            status_code=status.HTTP_409_CONFLICT,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(
            error_code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(AppException):
    def __init__(
        self, message: str = "You don't have permission to perform this action"
    ):
        super().__init__(
            error_code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class BadRequestException(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(
            error_code="BAD_REQUEST",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class RateLimitException(AppException):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            error_code="RATE_LIMIT_EXCEEDED",
            message=f"Too many requests. Please try again in {retry_after} seconds.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retry_after": retry_after},
        )
