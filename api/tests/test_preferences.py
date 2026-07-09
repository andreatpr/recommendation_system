from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def known_cities(client: TestClient) -> list[str]:
    response = client.get("/cities")
    return [c["city"] for c in response.json()["cities"][:5]]


def _body(cities: list[str], ratings: list[float] | None = None, **extra):
    ratings = ratings or [5.0] * len(cities)
    return {
        "preferences": [{"city": c, "rating": r} for c, r in zip(cities, ratings)],
        **extra,
    }


def test_valid_preferences(client: TestClient, known_cities: list[str]) -> None:
    response = client.post(
        "/recommendations/preferences", json=_body(known_cities[:3], [5, 4, 3], k=5)
    )
    assert response.status_code == 200
    data = response.json()
    assert data["method"] == "preferences"
    assert data["is_cold_start"] is False
    assert len(data["recommendations"]) == 5
    scores = [r["score"] for r in data["recommendations"]]
    assert scores == sorted(scores, reverse=True)


def test_rated_cities_excluded(client: TestClient, known_cities: list[str]) -> None:
    response = client.post(
        "/recommendations/preferences", json=_body(known_cities[:3], k=213)
    )
    recommended = {r["city"] for r in response.json()["recommendations"]}
    assert recommended.isdisjoint(set(known_cities[:3]))


def test_unknown_city_returns_422(client: TestClient, known_cities: list[str]) -> None:
    response = client.post(
        "/recommendations/preferences",
        json=_body([known_cities[0], "atlantis-perdida"]),
    )
    assert response.status_code == 422
    assert "atlantis-perdida" in response.json()["detail"]


def test_empty_preferences_returns_422(client: TestClient) -> None:
    response = client.post("/recommendations/preferences", json={"preferences": []})
    assert response.status_code == 422


def test_too_many_preferences_returns_422(
    client: TestClient, known_cities: list[str]
) -> None:
    prefs = [{"city": known_cities[0], "rating": 5}] * 21
    response = client.post("/recommendations/preferences", json={"preferences": prefs})
    assert response.status_code == 422


@pytest.mark.parametrize("rating", [0, 6])
def test_rating_out_of_range_returns_422(
    client: TestClient, known_cities: list[str], rating: float
) -> None:
    response = client.post(
        "/recommendations/preferences", json=_body([known_cities[0]], [rating])
    )
    assert response.status_code == 422


@pytest.mark.parametrize("k", [0, 300])
def test_k_out_of_range_returns_422(
    client: TestClient, known_cities: list[str], k: int
) -> None:
    response = client.post(
        "/recommendations/preferences", json=_body(known_cities[:2], k=k)
    )
    assert response.status_code == 422


def test_default_k_is_ten(client: TestClient, known_cities: list[str]) -> None:
    response = client.post("/recommendations/preferences", json=_body(known_cities[:3]))
    assert len(response.json()["recommendations"]) == 10


def test_enrichment_fields_present(client: TestClient, known_cities: list[str]) -> None:
    response = client.post("/recommendations/preferences", json=_body(known_cities[:3]))
    first = response.json()["recommendations"][0]
    assert isinstance(first["avg_rating"], float)
    assert isinstance(first["reviewers"], int)
    assert 0.0 <= first["popularity"] <= 1.0
    assert first["badge"] in (None, "popular", "hidden_gem")


def test_city_names_case_insensitive(
    client: TestClient, known_cities: list[str]
) -> None:
    response = client.post(
        "/recommendations/preferences", json=_body([known_cities[0].title()])
    )
    assert response.status_code == 200


def test_duplicate_cities_keep_last(client: TestClient, known_cities: list[str]) -> None:
    city = known_cities[0]
    response = client.post(
        "/recommendations/preferences", json=_body([city, city], [1, 5])
    )
    assert response.status_code == 200
    assert city not in {r["city"] for r in response.json()["recommendations"]}
