from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import DispatcherUser
from app.db import get_db
from app.repositories import UsersRepository

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/masters")
async def list_masters(
    current_user: DispatcherUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    """List masters (id, username). Dispatcher only."""
    repo = UsersRepository(db)
    return await repo.list_masters()
