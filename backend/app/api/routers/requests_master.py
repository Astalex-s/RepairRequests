from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import MasterUser
from app.db import get_db
from app.repositories import RequestsRepository
from app.schemas import RequestRead
from app.services import RequestsService

router = APIRouter(tags=["requests-master"])


@router.get("/master/requests", response_model=list[RequestRead])
async def list_my_requests(
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RequestRead]:
    """List requests assigned to current master."""
    repo = RequestsRepository(db)
    service = RequestsService(repo)
    requests = await service.list_for_master(current_user.id)
    return [RequestRead.model_validate(r) for r in requests]


@router.patch("/requests/{request_id}/take", response_model=RequestRead)
async def take_request(
    request_id: int,
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Take request in work (atomic). Returns 409 if already taken."""
    repo = RequestsRepository(db)
    service = RequestsService(repo)
    req = await service.take_in_work(request_id, current_user.id)
    return RequestRead.model_validate(req)


@router.patch("/requests/{request_id}/done", response_model=RequestRead)
async def mark_request_done(
    request_id: int,
    current_user: MasterUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Mark request as done. Master only."""
    repo = RequestsRepository(db)
    service = RequestsService(repo)
    req = await service.mark_done(request_id)
    return RequestRead.model_validate(req)
