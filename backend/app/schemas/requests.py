from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RequestCreate(BaseModel):
    """Schema for creating a repair request. API: clientName, clientPhone, problemText, address."""

    client_name: str = Field(..., min_length=1, max_length=255, alias="clientName")
    client_phone: str = Field(..., min_length=1, max_length=64, alias="clientPhone")
    description: str = Field(..., min_length=1, alias="problemText")
    address: Optional[str] = Field(None, max_length=512, alias="address")

    model_config = ConfigDict(populate_by_name=True)


class RequestRead(BaseModel):
    """Schema for reading a repair request. API: clientName, clientPhone, problemText, assignedTo, assignedToUsername, etc."""

    id: int = Field(..., alias="id")
    client_name: str = Field(..., alias="clientName")
    client_phone: str = Field(..., alias="clientPhone")
    description: str = Field(..., alias="problemText")
    address: Optional[str] = Field(None, alias="address")
    status: str = Field(..., alias="status")
    master_id: Optional[int] = Field(None, alias="assignedTo")
    assigned_to_username: Optional[str] = Field(None, alias="assignedToUsername")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )

    @model_validator(mode="before")
    @classmethod
    def add_master_username(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        if hasattr(data, "master") and data.master is not None:
            d = {k: getattr(data, k, None) for k in ("id", "client_name", "client_phone", "description", "address", "status", "master_id", "created_at", "updated_at")}
            d["assigned_to_username"] = data.master.username
            return d
        return data


class RequestAssign(BaseModel):
    """Schema for assigning a request to a master (take in work). API: masterId."""

    master_id: int = Field(..., alias="masterId")

    model_config = ConfigDict(populate_by_name=True)


class RequestStatusUpdate(BaseModel):
    """Schema for updating request status."""

    status: str = Field(..., min_length=1, max_length=32, alias="status")

    model_config = ConfigDict(populate_by_name=True)
