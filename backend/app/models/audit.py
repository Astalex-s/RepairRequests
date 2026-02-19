from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.request import RepairRequest
    from app.models.user import User


class RequestAuditEvent(Base):
    """Audit log for repair request state changes."""

    __tablename__ = "request_audit_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("repair_requests.id"), index=True)
    action: Mapped[str] = mapped_column(String(32))
    actor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    actor_username: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    old_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    request: Mapped["RepairRequest"] = relationship(
        "RepairRequest",
        back_populates="audit_events",
        foreign_keys=[request_id],
    )
