from __future__ import annotations

from fastapi import APIRouter, Query, Request

from .. import recommender
from ..schemas import CityScore, RecommendationResponse

router = APIRouter(prefix="/recommendations")


def _to_city_scores(state, results: list[tuple[str, float]]) -> list[CityScore]:
    return [
        CityScore(city=c, score=s, cluster=int(state.city_cluster_map.get(c, -1)))
        for c, s in results
    ]


@router.get("/popularity", response_model=RecommendationResponse)
def get_popularity(
    request: Request,
    k: int = Query(10, ge=1, le=213),
) -> RecommendationResponse:
    state = request.app.state.model
    results = recommender.recommend_popularity(state, k=k)
    return RecommendationResponse(
        user_id="",
        method="popularity",
        is_cold_start=True,
        recommendations=_to_city_scores(state, results),
    )


@router.get("/{user_id}", response_model=RecommendationResponse)
def get_recommendations(
    request: Request,
    user_id: str,
    k: int = Query(10, ge=1, le=213),
    w_content: float | None = Query(None, ge=0, le=1),
    w_pop: float | None = Query(None, ge=0, le=1),
    w_cf: float | None = Query(None, ge=0, le=1),
) -> RecommendationResponse:
    state = request.app.state.model

    results = recommender.recommend_hybrid(
        state, user_id, k=k, w_content=w_content, w_pop=w_pop, w_cf=w_cf
    )
    if results:
        return RecommendationResponse(
            user_id=user_id,
            method="hybrid",
            is_cold_start=False,
            recommendations=_to_city_scores(state, results),
        )

    fallback = recommender.recommend_popularity(state, k=k)
    return RecommendationResponse(
        user_id=user_id,
        method="popularity",
        is_cold_start=True,
        recommendations=_to_city_scores(state, fallback),
    )
