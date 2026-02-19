from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.settings import settings


def _make_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


engine: AsyncEngine = create_async_engine(
    _make_async_url(settings.DATABASE_URL),
    echo=False,
)
