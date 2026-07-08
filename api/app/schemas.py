from __future__ import annotations

from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class DataQuality(BaseModel):
    cluster_popularity_source: str
    seen_exclusion_available: bool
    cities_filtered_count: int
    cities_scored_count: int


class MetricsSnapshot(BaseModel):
    precision: float
    recall: float
    ndcg: float
    map: float


class ReportedMetrics(BaseModel):
    k: int
    evaluation_protocol: str
    n_users_eval: int
    baseline_popularity: MetricsSnapshot
    hybrid: MetricsSnapshot


class ModelInfoResponse(BaseModel):
    n_users: int
    n_cities: int
    n_factors: int
    hybrid_config: dict[str, float]
    metrics: ReportedMetrics
    data_quality: DataQuality


class CityScore(BaseModel):
    city: str
    score: float
    cluster: int


class RecommendationResponse(BaseModel):
    user_id: str
    method: str
    is_cold_start: bool
    recommendations: list[CityScore]


class CityInfo(BaseModel):
    city: str
    cluster: int


class CityListResponse(BaseModel):
    total: int
    cities: list[CityInfo]


class SampleUsersResponse(BaseModel):
    user_ids: list[str]


class NewUserRating(BaseModel):
    city: str
    rating: float = Field(ge=1.0, le=5.0)


class NewUserRecommendationRequest(BaseModel):
    ratings: list[NewUserRating]
    k: int = Field(default=10, ge=1, le=50)


class NewUserRecommendationItem(BaseModel):
    city: str
    score: float
    content_score: float
    popularity_score: float
    cluster: int | None = None


class NewUserRecommendationResponse(BaseModel):
    method: str
    is_cold_start: bool
    input_cities: list[str]
    ignored_cities: list[str]
    recommendations: list[NewUserRecommendationItem]