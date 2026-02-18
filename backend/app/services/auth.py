from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.core.settings import settings
from app.models import User
from app.repositories import UsersRepository


class AuthService:
    def __init__(self, users_repo: UsersRepository) -> None:
        self._users_repo = users_repo

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except Exception:
            return False

    def create_access_token(self, user: User) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {
            "sub": str(user.id),
            "role": user.role,
            "exp": expire,
        }
        return jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    async def authenticate_user(
        self,
        username: str,
        password: str,
    ) -> Optional[User]:
        """Returns User if credentials valid, None otherwise. Safe: no error details."""
        user = await self._users_repo.get_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user
