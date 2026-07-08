"""Evaluation metrics reported in notebooks/w10.ipynb (cells 63 and 91).

These are hardcoded constants, not derived at runtime: they come from an offline
leave-one-out evaluation whose train/test split (w10_train_uc.parquet /
w10_test_uc.parquet) is not part of the served hybrid_artifacts.pkl.
"""

REPORTED_METRICS = {
    "k": 4,
    "evaluation_protocol": "leave-one-out",
    "n_users_eval": 7991,
    "baseline_popularity": {
        "precision": 0.0321,
        "recall": 0.1283,
        "ndcg": 0.0856,
        "map": 0.0714,
    },
    "hybrid": {
        "precision": 0.1302,
        "recall": 0.5207,
        "ndcg": 0.4041,
        "map": 0.3647,
    },
}
