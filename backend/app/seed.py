"""Seed dev users and sample requests. Run: python -m app.seed. Dev-only."""

import asyncio

import bcrypt

from app.db.session import async_session_factory
from app.models import RepairRequest
from app.repositories import RequestsRepository, UsersRepository

# Dev users: username, plain_password (for hashing), role. Only in README for dev.
_DEV_USERS = [
    ("dispatcher1", "dev123", "dispatcher"),
    ("master1", "dev123", "master"),
    ("master2", "dev123", "master"),
]

# Sample requests for testing: (client_name, client_phone, description, address)
_DEV_REQUESTS = [
    ("Иванов Иван", "+7 999 111-22-33", "Не работает розетка в кухне", "ул. Ленина, 1"),
    ("Петрова Мария", "+7 999 222-33-44", "Течёт кран в ванной", "пр. Мира, 15"),
    ("Сидоров Пётр", "+7 999 333-44-55", "Не включается свет в коридоре", "ул. Гагарина, 7"),
]


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def run_seed() -> None:
    async with async_session_factory() as session:
        users_repo = UsersRepository(session)
        requests_repo = RequestsRepository(session)

        # 1. Users
        for username, plain_password, role in _DEV_USERS:
            password_hash = _hash_password(plain_password)
            await users_repo.create_if_missing(username, password_hash, role)
        await session.flush()

        # 2. Masters for assignment
        master1 = await users_repo.get_by_username("master1")
        master2 = await users_repo.get_by_username("master2")
        master1_id = master1.id if master1 else None
        master2_id = master2.id if master2 else None

        # 3. Sample requests (only if our test requests don't exist — idempotent)
        _TEST_PHONES = {"+7 999 111-22-33", "+7 999 222-33-44", "+7 999 333-44-55"}
        existing = await requests_repo.list_requests(None)
        has_test_requests = any(
            r.client_phone in _TEST_PHONES for r in existing
        )
        if not has_test_requests:
            for i, (name, phone, desc, addr) in enumerate(_DEV_REQUESTS):
                status = "new"
                master_id = None
                if i == 1 and master1_id:
                    status = "assigned"
                    master_id = master1_id
                elif i == 2 and master2_id:
                    status = "in_progress"
                    master_id = master2_id
                req = RepairRequest(
                    client_name=name,
                    client_phone=phone,
                    description=desc,
                    address=addr,
                    status=status,
                    master_id=master_id,
                )
                session.add(req)
            await session.flush()

        await session.commit()
    print("Seed completed: dev users and sample requests created if missing")


if __name__ == "__main__":
    asyncio.run(run_seed())
