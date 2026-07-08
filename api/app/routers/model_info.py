from __future__ import annotations

from fastapi import APIRouter, Request

from ..metrics import REPORTED_METRICS
from ..schemas import ModelInfoResponse

router = APIRouter()


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info(request: Request) -> ModelInfoResponse:
    state = request.app.state.model
    return ModelInfoResponse(
        n_users=len(state.user_to_idx),
        n_cities=len(state.content_city_to_idx),
        n_factors=state.user_factors.shape[1],
        hybrid_config=state.hybrid_config,
        metrics=REPORTED_METRICS,
        data_quality={
            "cluster_popularity_source": "approximate",
            "seen_exclusion_available": False,
            "cities_filtered_count": len(state.cities_filtered),
            "cities_scored_count": len(state.content_city_to_idx),
        },
    )
