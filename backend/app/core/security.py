from typing import Optional

from jose import JWTError, jwt

from app.core.settings import settings


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT. Returns payload dict or None if invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None
