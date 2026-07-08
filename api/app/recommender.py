from __future__ import annotations

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .model_loader import ModelState
from .schemas import NewUserRecommendationItem

def cf_score(state: ModelState, user_id: str, city: str) -> float:
    if user_id not in state.user_to_idx or city not in state.city_to_idx_cf:
        return 0.0
    uidx = state.user_to_idx[user_id]
    cidx = state.city_to_idx_cf[city]
    return float(np.dot(state.user_factors[uidx], state.item_factors[cidx]))


def recommend_hybrid(
    state: ModelState,
    user_id: str,
    k: int = 10,
    w_content: float | None = None,
    w_pop: float | None = None,
    w_cf: float | None = None,
) -> list[tuple[str, float]]:
    """Reimplements the recommend_hybrid function from w10.ipynb (cell 47).

    Candidate cities exclude locations already present in the user's training
    history, loaded from w10_train_uc.parquet, reproducing the notebook's
    recommendation logic. The candidate_penalty used in the notebook is always
    1.0 for this code path and is therefore intentionally omitted.
    """
    if user_id not in state.user_content_profiles:
        return []

    w_content = state.hybrid_config["content_weight"] if w_content is None else w_content
    w_pop = state.hybrid_config["popularity_weight"] if w_pop is None else w_pop
    w_cf = state.hybrid_config["cf_weight"] if w_cf is None else w_cf

    seen = state.seen_cities.get(user_id, set())

    candidates = [
        city
        for city in state.content_city_to_idx
        if city not in seen
    ]

    candidate_idx = [state.content_city_to_idx[c] for c in candidates]
    candidate_matrix = state.X_content[candidate_idx]

    user_profile = state.user_content_profiles[user_id]
    content_scores = cosine_similarity(user_profile.reshape(1, -1), candidate_matrix).flatten()

    scored: list[tuple[str, float]] = []
    for city, content_s in zip(candidates, content_scores):
        cluster_id = state.city_cluster_map.get(city)
        pop_s = state.cluster_popularity.get(cluster_id, {}).get(city, 0.0)

        cf_s = cf_score(state, user_id, city)
        cf_s = (cf_s - state.cf_min) / (state.cf_max - state.cf_min + 1e-9)

        hybrid_s = w_content * content_s + w_pop * pop_s + w_cf * cf_s
        scored.append((city, float(hybrid_s)))

    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:k]


def recommend_popularity(state: ModelState, k: int = 10) -> list[tuple[str, float]]:
    """Reimplements recommend_popularity from w10.ipynb (cell 41), ranking
    cities by baseline_score."""
    ranked = state.city_popularity[["city_clean", "baseline_score"]].sort_values(
        "baseline_score", ascending=False
    )
    return [(row.city_clean, float(row.baseline_score)) for row in ranked.head(k).itertuples()]

def recommend_new_user(
    state: ModelState,
    ratings: list[tuple[str, float]],
    k: int = 10,
    w_content: float = 0.90,
    w_pop: float = 0.10,
) -> tuple[list[NewUserRecommendationItem], list[str], list[str]]:
    """
    Recommend cities for a new user using a temporary content profile.

    The profile is built from the weighted average of the PCA city embeddings
    provided by the user. Since the user has no SVD latent factor, the score
    combines content similarity and cluster popularity only.
    """

    valid_inputs: list[tuple[str, float]] = []
    ignored_cities: list[str] = []

    for city, rating in ratings:
        city_clean = city.strip().lower()

        if city_clean in state.content_city_to_idx:
            valid_inputs.append((city_clean, rating))
        else:
            ignored_cities.append(city)

    if not valid_inputs:
        return [], [], ignored_cities

    input_cities = [city for city, _ in valid_inputs]

    vectors = []
    weights = []

    for city, rating in valid_inputs:
        idx = state.content_city_to_idx[city]
        vectors.append(state.X_content[idx])
        weights.append(rating)

    user_profile = np.average(
        np.vstack(vectors),
        axis=0,
        weights=np.array(weights),
    )

    seen = set(input_cities)

    candidates = [
        city
        for city in state.content_city_to_idx
        if city not in seen
    ]

    candidate_idx = [state.content_city_to_idx[c] for c in candidates]
    candidate_matrix = state.X_content[candidate_idx]

    content_scores = cosine_similarity(
        user_profile.reshape(1, -1),
        candidate_matrix,
    ).flatten()

    scored: list[NewUserRecommendationItem] = []

    for city, content_s in zip(candidates, content_scores):
        cluster_id = state.city_cluster_map.get(city)

        pop_s = (
            state.cluster_popularity
            .get(cluster_id, {})
            .get(city, 0.0)
        )

        score = (w_content * content_s) + (w_pop * pop_s)

        scored.append(
            NewUserRecommendationItem(
                city=city,
                score=float(score),
                content_score=float(content_s),
                popularity_score=float(pop_s),
                cluster=cluster_id,
            )
        )

    scored.sort(key=lambda item: item.score, reverse=True)

    return scored[:k], input_cities, ignored_cities