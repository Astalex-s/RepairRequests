from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.repositories import AuditRepository, RequestsRepository
from app.schemas import RequestCreate, RequestRead
from app.services import RequestsService

router = APIRouter(prefix="/requests", tags=["requests-public"])


@router.post("", response_model=RequestRead)
async def create_request(
    body: RequestCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RequestRead:
    """Create repair request (public, no JWT)."""
    repo = RequestsRepository(db)
    audit_repo = AuditRepository(db)
    service = RequestsService(repo, audit_repo)
    req = await service.create_request_public(
        client_name=body.client_name,
        client_phone=body.client_phone,
        description=body.description,
        address=body.address,
    )
    return RequestRead.model_validate(req)
