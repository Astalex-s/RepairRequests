from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routers import auth, requests_dispatcher, requests_master, requests_public
from app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
)
from app.core.settings import settings

app = FastAPI(title="RepairRequests")

app.include_router(auth.router)
app.include_router(requests_public.router)
app.include_router(requests_dispatcher.router)
app.include_router(requests_master.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
