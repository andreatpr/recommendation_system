from __future__ import annotations

from typing import Literal

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
    avg_rating: float | None = None
    reviewers: int | None = None
    popularity: float | None = None
    badge: Literal["popular", "hidden_gem"] | None = None


class RecommendationResponse(BaseModel):
    user_id: str
    method: str
    is_cold_start: bool
    recommendations: list[CityScore]


class PreferenceItem(BaseModel):
    city: str
    rating: float = Field(ge=1, le=5)


class PreferencesRequest(BaseModel):
    preferences: list[PreferenceItem] = Field(min_length=1, max_length=20)
    k: int = Field(10, ge=1, le=213)
    w_content: float | None = Field(None, ge=0, le=1)
    w_pop: float | None = Field(None, ge=0, le=1)


class CityInfo(BaseModel):
    city: str
    cluster: int
    avg_rating: float | None = None
    reviewers: int | None = None
    popularity: float | None = None
    badge: Literal["popular", "hidden_gem"] | None = None


class CityListResponse(BaseModel):
    total: int
    cities: list[CityInfo]


class SampleUsersResponse(BaseModel):
    user_ids: list[str]
