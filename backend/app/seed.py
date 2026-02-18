"""Seed dev users. Run: python -m app.seed. Dev-only."""
import asyncio

import bcrypt

from app.db.session import async_session_factory
from app.repositories import UsersRepository

# Dev users: username, plain_password (for hashing), role. Only in README for dev.
_DEV_USERS = [
    ("dispatcher1", "dev123", "dispatcher"),
    ("master1", "dev123", "master"),
    ("master2", "dev123", "master"),
]


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def run_seed() -> None:
    async with async_session_factory() as session:
        repo = UsersRepository(session)
        for username, plain_password, role in _DEV_USERS:
            password_hash = _hash_password(plain_password)
            await repo.create_if_missing(username, password_hash, role)
        await session.commit()
    print("Seed completed: dev users created if missing")


if __name__ == "__main__":
    asyncio.run(run_seed())
