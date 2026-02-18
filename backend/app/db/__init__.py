from app.db.base import Base

__all__ = ["Base", "engine", "async_session_factory", "get_db"]


def __getattr__(name: str):
    if name == "engine":
        from app.db.engine import engine
        return engine
    if name == "async_session_factory":
        from app.db.session import async_session_factory
        return async_session_factory
    if name == "get_db":
        from app.db.session import get_db
        return get_db
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
