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

DEFAULT_TRAIN_UC_PATH = Path(
    os.environ.get(
        "TRAIN_UC_PATH",
        Path(__file__).resolve().parent.parent
        / "data"
        / "w11"
        / "w10_train_uc.parquet",
    )
)

DEFAULT_USER_CITY_F_PATH = Path(
    os.environ.get(
        "USER_CITY_F_PATH",
        Path(__file__).resolve().parent.parent
        / "data"
        / "w11"
        / "w10_user_city_f.parquet",
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
    seen_cities: dict[str, set[str]] = field(default_factory=dict)

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
    train_uc = pd.read_parquet(DEFAULT_TRAIN_UC_PATH)

    seen_cities = (
        train_uc
        .groupby("user_id")["city_clean"]
        .apply(set)
        .to_dict()
    )
    state.seen_cities = seen_cities

    state.city_cluster_map = dict(
        zip(state.cities_filtered["city_clean"], state.cities_filtered["cluster"])
    )

    user_city_f = pd.read_parquet(DEFAULT_USER_CITY_F_PATH)

    state.cluster_popularity = _derive_cluster_popularity(
        user_city_f,
        state.city_cluster_map
    )
    state.cf_min, state.cf_max = _derive_cf_bounds(state.user_factors, state.item_factors)

    return state


def _derive_cluster_popularity(
    user_city_f: pd.DataFrame,
    city_cluster_map: dict[str, int],
) -> dict[int, dict[str, float]]:
    """
    Reconstruct cluster-level popularity exactly as implemented in
    notebooks/w10.ipynb (cell 46).

    For each cluster:
      1. Aggregate user-city interactions.
      2. Compute popularity = avg_rating * log1p(n_users).
      3. Min-max normalize popularity within the cluster.
    """

    df = user_city_f.copy()

    # Recreate the cluster labels used in the notebook
    df["cluster"] = df["city_clean"].map(city_cluster_map)

    cluster_popularity: dict[int, dict[str, float]] = {}

    for cluster_id, g in df.groupby("cluster"):

        stats = (
            g.groupby("city_clean")
            .agg(
                avg_rating=("rating", "mean"),
                n_users=("user_id", "nunique"),
            )
        )

        stats["popularity_score"] = (
            stats["avg_rating"]
            * np.log1p(stats["n_users"])
        )

        stats["popularity_score"] = (
            stats["popularity_score"]
            - stats["popularity_score"].min()
        ) / (
            stats["popularity_score"].max()
            - stats["popularity_score"].min()
            + 1e-9
        )

        cluster_popularity[cluster_id] = (
            stats["popularity_score"].to_dict()
        )

    return cluster_popularity

def _derive_cf_bounds(user_factors: np.ndarray, item_factors: np.ndarray) -> tuple[float, float]:
    """cf_min/cf_max over the full population (213 cities x n_users).

    w10.ipynb (cell 30) estimates these from a 500-user sample; computing them
    over the full matrix is more precise and just as cheap (213 x 7991).
    """
    full = item_factors @ user_factors.T
    return float(full.min()), float(full.max())
