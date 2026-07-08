from __future__ import annotations

from fastapi.testclient import TestClient


def test_all_cities(client: TestClient) -> None:
    response = client.get("/cities")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 213
    assert len(body["cities"]) == 213
    assert "cluster" in body["cities"][0]


def test_filter_by_valid_cluster(client: TestClient) -> None:
    response = client.get("/cities", params={"cluster": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert {c["city"] for c in body["cities"]} == {"clearwater beach", "madeira beach"}
    assert all(c["cluster"] == 2 for c in body["cities"])


def test_filter_by_invalid_cluster_returns_empty(client: TestClient) -> None:
    response = client.get("/cities", params={"cluster": 999})
    assert response.status_code == 200
    assert response.json() == {"total": 0, "cities": []}
