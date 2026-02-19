from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import RepairRequest


class RequestFilter:
    """Filter for list_requests. All fields optional."""

    def __init__(
        self,
        status: Optional[str] = None,
        master_id: Optional[int] = None,
    ) -> None:
        self.status = status
        self.master_id = master_id


class RequestsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_request_public(
        self,
        client_name: str,
        client_phone: str,
        description: str,
        address: Optional[str] = None,
    ) -> RepairRequest:
        req = RepairRequest(
            client_name=client_name,
            client_phone=client_phone,
            description=description,
            address=address,
            status="new",
        )
        self._session.add(req)
        await self._session.flush()
        await self._session.refresh(req)
        return req

    async def list_requests(
        self,
        filter_: Optional[RequestFilter] = None,
    ) -> list[RepairRequest]:
        stmt = (
            select(RepairRequest)
            .options(selectinload(RepairRequest.master))
            .order_by(RepairRequest.created_at.desc())
        )
        if filter_:
            if filter_.status is not None:
                stmt = stmt.where(RepairRequest.status == filter_.status)
            if filter_.master_id is not None:
                stmt = stmt.where(RepairRequest.master_id == filter_.master_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, request_id: int) -> Optional[RepairRequest]:
        stmt = select(RepairRequest).where(RepairRequest.id == request_id)
        result = await self._session.execute(stmt)
        return result.scalars().first()

    async def assign_master(
        self,
        request_id: int,
        master_id: int,
    ) -> Optional[RepairRequest]:
        req = await self.get_by_id(request_id)
        if not req:
            return None
        req.master_id = master_id
        req.status = "assigned"
        await self._session.flush()
        await self._session.refresh(req)
        return req

    async def cancel(self, request_id: int) -> Optional[RepairRequest]:
        req = await self.get_by_id(request_id)
        if not req:
            return None
        req.status = "cancelled"
        await self._session.flush()
        await self._session.refresh(req)
        return req

    async def list_for_master(self, master_id: int) -> list[RepairRequest]:
        return await self.list_requests(RequestFilter(master_id=master_id))

    async def take_in_work_atomic(
        self,
        request_id: int,
        master_id: int,
    ) -> bool:
        """One conditional UPDATE for 'new' requests. Returns True if succeeded."""
        stmt = (
            update(RepairRequest)
            .where(
                RepairRequest.id == request_id,
                RepairRequest.status == "new",
                RepairRequest.master_id.is_(None),
            )
            .values(master_id=master_id, status="in_progress")
        )
        result = await self._session.execute(stmt)
        return result.rowcount > 0

    async def start_assigned_request(
        self,
        request_id: int,
        master_id: int,
    ) -> Optional[RepairRequest]:
        """Transition 'assigned' to 'in_progress' when master_id matches."""
        req = await self.get_by_id(request_id)
        if not req or req.status != "assigned" or req.master_id != master_id:
            return None
        req.status = "in_progress"
        await self._session.flush()
        await self._session.refresh(req)
        return req

    async def mark_done(self, request_id: int) -> Optional[RepairRequest]:
        req = await self.get_by_id(request_id)
        if not req:
            return None
        req.status = "done"
        await self._session.flush()
        await self._session.refresh(req)
        return req
