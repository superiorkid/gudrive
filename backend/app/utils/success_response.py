from app.schemas.response import SuccessAPIResponse


def success_response(data=None, message="Success", meta=None):
    return SuccessAPIResponse(
        success=True,
        message=message,
        data=data,
        meta=meta,
    )
