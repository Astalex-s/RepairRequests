from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import DispatcherUser
from app.db import get_db
from app.repositories import RequestsRepository
from app.schemas import RequestAssign, RequestRead
from app.services import RequestsService

router = APIRouter(prefix="/requests", tags=["requests-dispatcher"])


@router.get("", response_model=list[RequestRead])
async def list_requests(
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Annotated[Optional[str], Query()] = None,
) -> list[RequestRead]:
    """List requests with optional status filter. Dispatcher only."""
    repo = RequestsRepository(db)
    service = RequestsService(repo)
    requests = await service.list_requests(status=status)
    return [RequestRead.model_validate(r) for r in requests]


@router.patch("/{request_id}/assign", response_model=RequestRead)
async def assign_request(
    request_id: int,
    body: RequestAssign,
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Assign master to request. Dispatcher only."""
    repo = RequestsRepository(db)
    service = RequestsService(repo)
    req = await service.assign_master(request_id, body.master_id)
    await db.refresh(req, attribute_names=["master"])
    return RequestRead.model_validate(req)


@router.patch("/{request_id}/cancel", response_model=RequestRead)
async def cancel_request(
    request_id: int,
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Cancel request. Dispatcher only."""
    repo = RequestsRepository(db)
    service = RequestsService(repo)
    req = await service.cancel(request_id)
    await db.refresh(req, attribute_names=["master"])
    return RequestRead.model_validate(req)
