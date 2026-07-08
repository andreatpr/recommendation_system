from __future__ import annotations

from fastapi.testclient import TestClient


def test_model_info_shape(client: TestClient) -> None:
    response = client.get("/model-info")
    assert response.status_code == 200
    body = response.json()

    assert body["n_users"] == 7991
    assert body["n_cities"] == 213
    assert body["n_factors"] == 40

    hybrid_config = body["hybrid_config"]
    assert hybrid_config["cf_weight"] == 0.85
    assert hybrid_config["content_weight"] == 0.05
    assert hybrid_config["popularity_weight"] == 0.10
    assert hybrid_config["top_k"] == 10

    metrics = body["metrics"]
    assert metrics["hybrid"]["recall"] > metrics["baseline_popularity"]["recall"]

    data_quality = body["data_quality"]
    assert data_quality["cluster_popularity_source"] == "approximate"
    assert data_quality["seen_exclusion_available"] is False
