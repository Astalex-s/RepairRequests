from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import DispatcherUser
from app.db import get_db
from app.repositories import AuditRepository, RequestsRepository
from app.schemas import RequestAssign, RequestRead
from app.services import RequestsService

router = APIRouter(prefix="/requests", tags=["requests-dispatcher"])


def _requests_service(db: AsyncSession) -> RequestsService:
    return RequestsService(RequestsRepository(db), AuditRepository(db))


@router.get("", response_model=list[RequestRead])
async def list_requests(
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Annotated[Optional[str], Query()] = None,
) -> list[RequestRead]:
    """List requests with optional status filter. Dispatcher only."""
    service = _requests_service(db)
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
    service = _requests_service(db)
    req = await service.assign_master(
        request_id,
        body.master_id,
        actor_id=current_user.id,
        actor_username=current_user.username,
    )
    await db.refresh(req, attribute_names=["master"])
    return RequestRead.model_validate(req)


@router.patch("/{request_id}/cancel", response_model=RequestRead)
async def cancel_request(
    request_id: int,
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Cancel request. Dispatcher only."""
    service = _requests_service(db)
    req = await service.cancel(
        request_id,
        actor_id=current_user.id,
        actor_username=current_user.username,
    )
    await db.refresh(req, attribute_names=["master"])
    return RequestRead.model_validate(req)


@router.get("/{request_id}/history")
async def get_request_history(
    request_id: int,
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get audit history for a request. Dispatcher only."""
    service = _requests_service(db)
    req = await service.get_request(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    events = await service.get_request_history(request_id)
    return [
        {
            "id": e.id,
            "action": e.action,
            "actorUsername": e.actor_username,
            "oldStatus": e.old_status,
            "newStatus": e.new_status,
            "createdAt": e.created_at.isoformat(),
        }
        for e in events
    ]
