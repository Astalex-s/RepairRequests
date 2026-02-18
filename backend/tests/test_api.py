"""API endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_ok(async_client: AsyncClient):
    """GET /health returns 200 and {"status": "ok"}."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_request_public(async_client: AsyncClient):
    """POST /requests creates request and returns 200 with id, status=new."""
    body = {
        "clientName": "Test",
        "clientPhone": "+7",
        "problemText": "Test problem",
    }
    response = await async_client.post("/requests", json=body)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] == "new"
    assert data["clientName"] == "Test"


@pytest.mark.asyncio
async def test_auth_token_valid(async_client: AsyncClient):
    """POST /auth/token with valid credentials returns 200 and accessToken."""
    response = await async_client.post(
        "/auth/token",
        data={"username": "master1", "password": "dev123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert len(data["accessToken"]) > 0


@pytest.mark.asyncio
async def test_auth_token_invalid(async_client: AsyncClient):
    """POST /auth/token with wrong password returns 401."""
    response = await async_client.post(
        "/auth/token",
        data={"username": "master1", "password": "wrong"},
    )
    assert response.status_code == 401
