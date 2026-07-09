from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from .. import recommender

from ..schemas import CityScore, PreferencesRequest, RecommendationResponse

router = APIRouter(prefix="/recommendations")


def _to_city_scores(state, results: list[tuple[str, float]]) -> list[CityScore]:
    scores = []
    for c, s in results:
        stats = state.city_stats.get(c, {})
        scores.append(
            CityScore(
                city=c,
                score=s,
                cluster=int(state.city_cluster_map.get(c, -1)),
                avg_rating=stats.get("avg_rating"),
                reviewers=stats.get("reviewers"),
                popularity=stats.get("popularity"),
                badge=stats.get("badge"),
            )
        )
    return scores


@router.post("/preferences", response_model=RecommendationResponse)
def post_preferences(request: Request, body: PreferencesRequest) -> RecommendationResponse:
    state = request.app.state.model

    prefs = [(p.city.strip().lower(), p.rating) for p in body.preferences]
    invalid = sorted({c for c, _ in prefs if c not in state.content_city_to_idx})
    if invalid:
        raise HTTPException(
            status_code=422, detail=f"Ciudades desconocidas: {', '.join(invalid)}"
        )

    results = recommender.recommend_from_preferences(
        state,
        prefs,
        k=body.k,
        w_content=body.w_content if body.w_content is not None else 0.7,
        w_pop=body.w_pop if body.w_pop is not None else 0.3,
    )
    return RecommendationResponse(
        user_id="",
        method="preferences",
        is_cold_start=False,
        recommendations=_to_city_scores(state, results),
    )


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