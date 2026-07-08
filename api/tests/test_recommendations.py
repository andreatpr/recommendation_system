from __future__ import annotations

from fastapi.testclient import TestClient


def test_known_user_gets_hybrid_recommendations(client: TestClient, known_user_id: str) -> None:
    response = client.get(f"/recommendations/{known_user_id}", params={"k": 5})
    assert response.status_code == 200
    body = response.json()

    assert body["method"] == "hybrid"
    assert body["is_cold_start"] is False
    assert len(body["recommendations"]) == 5

    scores = [item["score"] for item in body["recommendations"]]
    assert scores == sorted(scores, reverse=True)


def test_unknown_user_falls_back_to_popularity(client: TestClient) -> None:
    response = client.get("/recommendations/this-user-does-not-exist", params={"k": 5})
    assert response.status_code == 200
    body = response.json()

    assert body["method"] == "popularity"
    assert body["is_cold_start"] is True
    assert len(body["recommendations"]) == 5


def test_k_out_of_range_is_rejected(client: TestClient, known_user_id: str) -> None:
    assert client.get(f"/recommendations/{known_user_id}", params={"k": 0}).status_code == 422
    assert client.get(f"/recommendations/{known_user_id}", params={"k": 1000}).status_code == 422


def test_default_k_is_ten(client: TestClient, known_user_id: str) -> None:
    response = client.get(f"/recommendations/{known_user_id}")
    assert len(response.json()["recommendations"]) == 10


def test_weight_override_changes_ranking(client: TestClient, known_user_id: str) -> None:
    default = client.get(f"/recommendations/{known_user_id}", params={"k": 10}).json()
    popularity_heavy = client.get(
        f"/recommendations/{known_user_id}",
        params={"k": 10, "w_content": 0.0, "w_pop": 1.0, "w_cf": 0.0},
    ).json()

    default_cities = [item["city"] for item in default["recommendations"]]
    popularity_heavy_cities = [item["city"] for item in popularity_heavy["recommendations"]]
    assert default_cities != popularity_heavy_cities


def test_popularity_endpoint(client: TestClient) -> None:
    response = client.get("/recommendations/popularity", params={"k": 5})
    assert response.status_code == 200
    body = response.json()
    assert body["method"] == "popularity"
    assert len(body["recommendations"]) == 5
