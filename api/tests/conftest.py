from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def known_user_id(client: TestClient) -> str:
    response = client.get("/users/sample", params={"n": 1})
    return response.json()["user_ids"][0]
