from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RequestCreate(BaseModel):
    """Schema for creating a repair request. API: clientName, clientPhone, problemText, address."""

    client_name: str = Field(..., min_length=1, max_length=255, alias="clientName")
    client_phone: str = Field(..., min_length=1, max_length=64, alias="clientPhone")
    description: str = Field(..., min_length=1, alias="problemText")
    address: Optional[str] = Field(None, max_length=512, alias="address")

    model_config = ConfigDict(populate_by_name=True)


class RequestRead(BaseModel):
    """Schema for reading a repair request. API: clientName, clientPhone, problemText, assignedTo, etc."""

    id: int = Field(..., alias="id")
    client_name: str = Field(..., alias="clientName")
    client_phone: str = Field(..., alias="clientPhone")
    description: str = Field(..., alias="problemText")
    address: Optional[str] = Field(None, alias="address")
    status: str = Field(..., alias="status")
    master_id: Optional[int] = Field(None, alias="assignedTo")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class RequestAssign(BaseModel):
    """Schema for assigning a request to a master (take in work). API: masterId."""

    master_id: int = Field(..., alias="masterId")

    model_config = ConfigDict(populate_by_name=True)


class RequestStatusUpdate(BaseModel):
    """Schema for updating request status."""

    status: str = Field(..., min_length=1, max_length=32, alias="status")

    model_config = ConfigDict(populate_by_name=True)
