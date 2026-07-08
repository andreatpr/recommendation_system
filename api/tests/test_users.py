from __future__ import annotations

from fastapi.testclient import TestClient


def test_sample_users_are_all_known(client: TestClient) -> None:
    response = client.get("/users/sample", params={"n": 5})
    assert response.status_code == 200
    user_ids = response.json()["user_ids"]
    assert len(user_ids) == 5

    for user_id in user_ids:
        rec_response = client.get(f"/recommendations/{user_id}")
        assert rec_response.json()["is_cold_start"] is False
