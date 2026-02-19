from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import MasterUser
from app.db import get_db
from app.repositories import AuditRepository, RequestsRepository
from app.schemas import RequestRead
from app.services import RequestsService

router = APIRouter(tags=["requests-master"])


def _requests_service(db: AsyncSession) -> RequestsService:
    return RequestsService(RequestsRepository(db), AuditRepository(db))


@router.get("/master/requests", response_model=list[RequestRead])
async def list_my_requests(
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RequestRead]:
    """List requests assigned to current master."""
    service = _requests_service(db)
    requests = await service.list_for_master(current_user.id)
    return [RequestRead.model_validate(r) for r in requests]


@router.patch("/requests/{request_id}/take", response_model=RequestRead)
async def take_request(
    request_id: int,
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Take request in work (atomic). Returns 409 if already taken."""
    service = _requests_service(db)
    req = await service.take_in_work(
        request_id,
        current_user.id,
        actor_username=current_user.username,
    )
    await db.refresh(req, attribute_names=["master"])
    return RequestRead.model_validate(req)


@router.patch("/requests/{request_id}/done", response_model=RequestRead)
async def mark_request_done(
    request_id: int,
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Mark request as done. Master only."""
    service = _requests_service(db)
    req = await service.mark_done(
        request_id,
        actor_id=current_user.id,
        actor_username=current_user.username,
    )
    await db.refresh(req, attribute_names=["master"])
    return RequestRead.model_validate(req)


@router.get("/master/requests/{request_id}/history")
async def get_master_request_history(
    request_id: int,
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get audit history for a request assigned to current master."""
    service = _requests_service(db)
    req = await service.get_request(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if req.master_id != current_user.id:
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
