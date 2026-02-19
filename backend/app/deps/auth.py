from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db import get_db
from app.models import User
from app.repositories import UsersRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=True)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Extract and validate JWT, return current user. Safe 401 on failure."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "Неверный логин или пароль"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "Неверный логин или пароль"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "Неверный логин или пароль"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    repo = UsersRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "Неверный логин или пароль"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_dispatcher(user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require dispatcher or admin role."""
    if user.role not in ("dispatcher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden", "message": "Неверный логин или пароль"},
        )
    return user


def require_master(user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require master role."""
    if user.role != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden", "message": "Неверный логин или пароль"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DispatcherUser = Annotated[User, Depends(require_dispatcher)]
MasterUser = Annotated[User, Depends(require_master)]
