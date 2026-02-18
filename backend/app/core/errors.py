from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def error_response(
    code: str,
    message: str,
    details: Any = None,
    status_code: int = 400,
) -> JSONResponse:
    body: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status_code, content=body)


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        code = detail.get("code", f"http_{exc.status_code}")
        message = detail.get("message", str(detail))
        details = detail.get("details")
    else:
        code = f"http_{exc.status_code}"
        message = str(detail) if detail else "Ошибка запроса"
        details = None

    if exc.status_code in (401, 403):
        message = "Неверный логин или пароль"
        details = None

    return error_response(code=code, message=message, details=details, status_code=exc.status_code)


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = exc.errors()
    details = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in errors]
    return error_response(
        code="validation_error",
        message="Ошибка валидации",
        details=details,
        status_code=422,
    )
