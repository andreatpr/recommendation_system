from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

DEFAULT_MODEL_PATH = Path(
    os.environ.get(
        "MODEL_PATH",
        Path(__file__).resolve().parent.parent / "data" / "models" / "hybrid_artifacts.pkl",
    )
)


@dataclass
class ModelState:
    user_factors: np.ndarray
    item_factors: np.ndarray
    user_to_idx: dict[str, int]
    idx_to_user: dict[int, str]
    city_to_idx_cf: dict[str, int]
    idx_to_city_cf: dict[int, str]
    city_content: pd.DataFrame
    X_content: np.ndarray
    content_city_to_idx: dict[str, int]
    user_content_profiles: dict[str, np.ndarray]
    city_popularity: pd.DataFrame
    cities_filtered: pd.DataFrame
    hybrid_config: dict[str, float]

    city_cluster_map: dict[str, int] = field(default_factory=dict)
    cluster_popularity: dict[int, dict[str, float]] = field(default_factory=dict)
    cf_min: float = 0.0
    cf_max: float = 1.0


def load_model_state(path: Path = DEFAULT_MODEL_PATH) -> ModelState:
    """Load the hybrid_artifacts.pkl produced by notebooks/w10.ipynb (cell 95).

    It was saved with joblib.dump(..., compress=3), so it must be loaded with
    joblib.load() -- a plain pickle.load() fails because joblib uses its own
    unpickler to read the NumpyArrayWrapper buffers that follow the pickle stream.
    """
    artifacts: dict[str, Any] = joblib.load(path)

    state = ModelState(
        user_factors=artifacts["user_factors"],
        item_factors=artifacts["item_factors"],
        user_to_idx=artifacts["user_to_idx"],
        idx_to_user=artifacts["idx_to_user"],
        city_to_idx_cf=artifacts["city_to_idx_cf"],
        idx_to_city_cf=artifacts["idx_to_city_cf"],
        city_content=artifacts["city_content"],
        X_content=artifacts["X_content"],
        content_city_to_idx=artifacts["content_city_to_idx"],
        user_content_profiles=artifacts["user_content_profiles"],
        city_popularity=artifacts["city_popularity"],
        cities_filtered=artifacts["cities_filtered"],
        hybrid_config=artifacts["hybrid_config"],
    )

    state.city_cluster_map = dict(
        zip(state.cities_filtered["city_clean"], state.cities_filtered["cluster"])
    )
    state.cluster_popularity = _derive_cluster_popularity(
        state.city_popularity, state.city_cluster_map
    )
    state.cf_min, state.cf_max = _derive_cf_bounds(state.user_factors, state.item_factors)

    return state


def _derive_cluster_popularity(
    city_popularity: pd.DataFrame, city_cluster_map: dict[str, int]
) -> dict[int, dict[str, float]]:
    """Approximate cluster-level popularity.

    w10.ipynb (cell 46) computes this from user_city_f (avg_rating * log1p(n_users),
    min-max normalized per cluster), but that parquet is an unresolved Git LFS
    pointer in this repo. This derives the same per-cluster min-max normalization
    from city_popularity['baseline_score'] (available in the pickle) instead --
    an approximation, not the exact notebook value. Exposed honestly via
    /model-info.data_quality.cluster_popularity_source.
    """
    df = city_popularity[["city_clean", "baseline_score"]].copy()
    df["cluster"] = df["city_clean"].map(city_cluster_map)

    cluster_popularity: dict[int, dict[str, float]] = {}
    for cluster_id, group in df.groupby("cluster"):
        lo, hi = group["baseline_score"].min(), group["baseline_score"].max()
        normalized = (group["baseline_score"] - lo) / (hi - lo + 1e-9)
        cluster_popularity[cluster_id] = dict(zip(group["city_clean"], normalized))
    return cluster_popularity


def _derive_cf_bounds(user_factors: np.ndarray, item_factors: np.ndarray) -> tuple[float, float]:
    """cf_min/cf_max over the full population (213 cities x n_users).

    w10.ipynb (cell 30) estimates these from a 500-user sample; computing them
    over the full matrix is more precise and just as cheap (213 x 7991).
    """
    full = item_factors @ user_factors.T
    return float(full.min()), float(full.max())
