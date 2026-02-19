from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RequestAuditEvent


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_event(
        self,
        request_id: int,
        action: str,
        *,
        actor_id: Optional[int] = None,
        actor_username: Optional[str] = None,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
    ) -> RequestAuditEvent:
        event = RequestAuditEvent(
            request_id=request_id,
            action=action,
            actor_id=actor_id,
            actor_username=actor_username,
            old_status=old_status,
            new_status=new_status,
        )
        self._session.add(event)
        await self._session.flush()
        await self._session.refresh(event)
        return event

    async def list_events(self, request_id: int) -> list[RequestAuditEvent]:
        stmt = (
            select(RequestAuditEvent)
            .where(RequestAuditEvent.request_id == request_id)
            .order_by(RequestAuditEvent.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
