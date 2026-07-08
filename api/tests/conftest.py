from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# On a fresh clone api/data/models/ does not exist (it is only populated inside the
# Docker image), so point tests at the repo's real artifact unless MODEL_PATH is set.
if "MODEL_PATH" not in os.environ:
    _repo_pickle = (
        Path(__file__).resolve().parents[2] / "data" / "processed" / "models" / "hybrid_artifacts.pkl"
    )
    _api_pickle = Path(__file__).resolve().parents[1] / "data" / "models" / "hybrid_artifacts.pkl"
    if not _api_pickle.exists() and _repo_pickle.exists():
        os.environ["MODEL_PATH"] = str(_repo_pickle)

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def known_user_id(client: TestClient) -> str:
    response = client.get("/users/sample", params={"n": 1})
    return response.json()["user_ids"][0]
