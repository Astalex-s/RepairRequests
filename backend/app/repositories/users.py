from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


def _user_to_master_dict(u: User) -> dict:
    return {"id": u.id, "username": u.username}


class UsersRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username)
        result = await self._session.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await self._session.execute(stmt)
        return result.scalars().first()

    async def create_if_missing(
        self,
        username: str,
        password_hash: str,
        role: str,
    ) -> User:
        existing = await self.get_by_username(username)
        if existing:
            return existing
        user = User(username=username, password_hash=password_hash, role=role)
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def list_masters(self) -> list[dict]:
        """Return list of masters: [{"id": 1, "username": "master1"}, ...]."""
        stmt = select(User).where(User.role == "master").order_by(User.username)
        result = await self._session.execute(stmt)
        users = result.scalars().all()
        return [_user_to_master_dict(u) for u in users]
