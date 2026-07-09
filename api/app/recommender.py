from __future__ import annotations

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .model_loader import ModelState

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


def recommend_from_preferences(
    state: ModelState,
    preferences: list[tuple[str, float]],
    k: int = 10,
    w_content: float = 0.7,
    w_pop: float = 0.3,
) -> list[tuple[str, float]]:
    """
    Content + cluster popularity recommendations for a brand-new user.
    The profile is built as the weighted average of the rated cities'
    PCA embeddings using weights = rating * log1p(n_reviews). The final
    score combines cosine similarity with cluster-normalized popularity.

    Cities must be pre-validated against content_city_to_idx (the router owns
    422s). Duplicate cities keep the last occurrence. Rated cities are excluded
    from the results.
    """
    prefs = dict(preferences)

    sel_idx = [state.content_city_to_idx[c] for c in prefs]
    ratings = np.array(list(prefs.values()), dtype=float)
    n_reviews = np.array(
    [
        state.city_stats.get(c, {}).get("reviews", 1)
        for c in prefs
    ],
    dtype=float,
)
    weights = ratings * np.log1p(n_reviews)
    weights = weights / (weights.sum() + 1e-9)
    profile = np.average(state.X_content[sel_idx], axis=0, weights=weights)

    candidates = [c for c in state.content_city_to_idx if c not in prefs]
    candidate_idx = [state.content_city_to_idx[c] for c in candidates]
    content_scores = cosine_similarity(
        profile.reshape(1, -1), state.X_content[candidate_idx]
    ).flatten()

    scored: list[tuple[str, float]] = []
    for city, content_s in zip(candidates, content_scores):

        cluster_id = state.city_cluster_map.get(city)

        pop_s = (
            state.cluster_popularity
            .get(cluster_id, {})
            .get(city, 0.0)
        )

        scored.append(
            (
                city,
                float(
                    w_content * content_s +
                    w_pop * pop_s
                )
            )
        )

    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:k]


def recommend_popularity(state: ModelState, k: int = 10) -> list[tuple[str, float]]:
    """Reimplements recommend_popularity from w10.ipynb (cell 41), ranking
    cities by baseline_score."""
    ranked = state.city_popularity[["city_clean", "baseline_score"]].sort_values(
        "baseline_score", ascending=False
    )
    return [(row.city_clean, float(row.baseline_score)) for row in ranked.head(k).itertuples()]
