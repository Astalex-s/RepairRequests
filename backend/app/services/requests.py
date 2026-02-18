from typing import Optional

from app.core.errors import DomainError
from app.models import RepairRequest
from app.repositories import RequestFilter, RequestsRepository

# Allowed status transitions: from_status -> [to_statuses]
# assigned = dispatcher assigned to master; in_progress = master working
_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "new": {"assigned", "in_progress", "cancelled"},
    "assigned": {"in_progress", "cancelled"},
    "in_progress": {"done", "cancelled"},
    "cancelled": set(),
    "done": set(),
}

MSG_REQUEST_NOT_FOUND = "Заявка не найдена"
MSG_INVALID_TRANSITION = "Недопустимый переход статуса"
MSG_ALREADY_TAKEN = "Заявка уже взята в работу"


class RequestsService:
    def __init__(self, requests_repo: RequestsRepository) -> None:
        self._repo = requests_repo

    def _check_transition(self, from_status: str, to_status: str) -> None:
        allowed = _ALLOWED_TRANSITIONS.get(from_status, set())
        if to_status not in allowed:
            raise DomainError(400, "invalid_transition", MSG_INVALID_TRANSITION)

    async def create_request_public(
        self,
        client_name: str,
        client_phone: str,
        description: str,
        address: Optional[str] = None,
    ) -> RepairRequest:
        return await self._repo.create_request_public(
            client_name=client_name,
            client_phone=client_phone,
            description=description,
            address=address,
        )

    async def list_requests(
        self,
        status: Optional[str] = None,
        master_id: Optional[int] = None,
    ) -> list[RepairRequest]:
        filter_ = RequestFilter(status=status, master_id=master_id)
        return await self._repo.list_requests(filter_)

    async def get_request(self, request_id: int) -> Optional[RepairRequest]:
        return await self._repo.get_by_id(request_id)

    async def take_in_work(self, request_id: int, master_id: int) -> RepairRequest:
        """Take request: either atomic take from 'new' pool, or start 'assigned' request."""
        req = await self._repo.get_by_id(request_id)
        if not req:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        if req.status == "assigned" and req.master_id == master_id:
            updated = await self._repo.start_assigned_request(request_id, master_id)
            return updated
        if req.status == "new":
            ok = await self._repo.take_in_work_atomic(request_id, master_id)
            if not ok:
                raise DomainError(409, "request_already_taken", MSG_ALREADY_TAKEN)
            req = await self._repo.get_by_id(request_id)
            return req
        raise DomainError(400, "invalid_transition", MSG_INVALID_TRANSITION)

    async def assign_master(
        self,
        request_id: int,
        master_id: int,
    ) -> RepairRequest:
        req = await self._repo.get_by_id(request_id)
        if not req:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        self._check_transition(req.status, "assigned")
        updated = await self._repo.assign_master(request_id, master_id)
        if not updated:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        return updated

    async def cancel(self, request_id: int) -> RepairRequest:
        req = await self._repo.get_by_id(request_id)
        if not req:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        self._check_transition(req.status, "cancelled")
        updated = await self._repo.cancel(request_id)
        if not updated:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        return updated

    async def list_for_master(self, master_id: int) -> list[RepairRequest]:
        return await self._repo.list_for_master(master_id)

    async def mark_done(self, request_id: int) -> RepairRequest:
        req = await self._repo.get_by_id(request_id)
        if not req:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        self._check_transition(req.status, "done")
        updated = await self._repo.mark_done(request_id)
        if not updated:
            raise DomainError(404, "not_found", MSG_REQUEST_NOT_FOUND)
        return updated
