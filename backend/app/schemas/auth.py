from pydantic import BaseModel, ConfigDict, Field


class Token(BaseModel):
    """JWT token response."""

    access_token: str = Field(..., alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")

    model_config = ConfigDict(populate_by_name=True)


class TokenPayload(BaseModel):
    """Payload for creating token (internal, snake_case)."""

    sub: str
    role: str
