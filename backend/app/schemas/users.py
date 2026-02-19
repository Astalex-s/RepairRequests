from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserRead(BaseModel):
    """User read schema for API responses. API: id, username, role, createdAt."""

    id: int
    username: str
    role: str
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )
