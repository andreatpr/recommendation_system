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
    """Reimplements w10.ipynb recommend_hybrid (cell 47).

    Candidate pool is all cities in content_city_to_idx -- the notebook excludes
    cities already seen by the user (via train_uc), but that parquet isn't
    available (see model_loader docstring), so this is a known, documented
    limitation (/model-info.data_quality.seen_exclusion_available = False).
    The notebook's candidate_penalty is always 1.0 for this code path, so it's
    intentionally omitted here.
    """
    if user_id not in state.user_content_profiles:
        return []

    w_content = state.hybrid_config["content_weight"] if w_content is None else w_content
    w_pop = state.hybrid_config["popularity_weight"] if w_pop is None else w_pop
    w_cf = state.hybrid_config["cf_weight"] if w_cf is None else w_cf

    candidates = list(state.content_city_to_idx.keys())
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
    """Reimplements w10.ipynb recommend_popularity (cell 41), ranking by
    baseline_score. Seen-city exclusion isn't available (see recommend_hybrid)."""
    ranked = state.city_popularity[["city_clean", "baseline_score"]].sort_values(
        "baseline_score", ascending=False
    )
    return [(row.city_clean, float(row.baseline_score)) for row in ranked.head(k).itertuples()]
