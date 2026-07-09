from __future__ import annotations

from fastapi import APIRouter, Query, Request

from ..schemas import CityInfo, CityListResponse

router = APIRouter()


@router.get("/cities", response_model=CityListResponse)
def get_cities(request: Request, cluster: int | None = Query(None)) -> CityListResponse:
    state = request.app.state.model
    cities = list(state.content_city_to_idx.keys())

    if cluster is not None:
        cities = [c for c in cities if state.city_cluster_map.get(c) == cluster]

    infos = []
    for c in sorted(cities):
        stats = state.city_stats.get(c, {})
        infos.append(
            CityInfo(
                city=c,
                cluster=int(state.city_cluster_map[c]),
                avg_rating=stats.get("avg_rating"),
                reviewers=stats.get("reviewers"),
                popularity=stats.get("popularity"),
                badge=stats.get("badge"),
            )
        )
    return CityListResponse(total=len(infos), cities=infos)
