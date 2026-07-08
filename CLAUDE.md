# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

City Discovery Engine — travel-oriented recommendation system built on the Yelp Academic Dataset. Academic project (course milestones W3–W15). Training/analysis logic lives in Jupyter notebooks; the Week 15 MVP adds a serving layer: `api/` (FastAPI, serves the pickled model with Swagger at `/docs`) and `web/` (Next.js UI), both run via `docker compose up --build` (API on :8000, web on host :3100 — 3000 collides with other local projects).

## Setup

```bash
pip install -r requirements.txt
```

Dataset: download Yelp Academic Dataset (requires signup, not in repo). Place these files in `data/raw/`:
- `yelp_academic_dataset_business.json`
- `yelp_academic_dataset_review.json`
- `yelp_academic_dataset_user.json`
- `yelp_academic_dataset_checkin.json`

## Pipeline (must run notebooks in this order)

The system is a strict linear pipeline — each notebook consumes parquet/npy artifacts written by the previous one. There is no orchestration script; execute notebooks manually in Jupyter in this order:

1. **`notebooks/pre.ipynb`** — loads raw Yelp JSON, cleans/normalizes. Sections: Business, Reviews, Users, Checkin, Scale Analysis. Outputs to `data/processed/`: `business_clean.parquet`, `business_categories.parquet`, `review_interactions.parquet`, `user_clean.parquet`, `checkin_clean.parquet`.

2. **`notebooks/week5_modified.ipynb`** — feature engineering: attributes/categories/reviews/checkins per city, then PCA. Outputs `city_features_new.parquet`, `city_features_pca_new.parquet`.

3. **`notebooks/week7.ipynb`** — clustering on PCA output: KMeans param sweep + best-k selection, DBSCAN param sweep, cluster profiling, 2D PC1/PC2 plots, silhouette failure analysis, KMeans-vs-DBSCAN comparison. Saves cluster assignments.

4. **`notebooks/w10.ipynb`** — hybrid recommendation model: collaborative filtering (SVD, sweeps n_factors) + content-based profiles + popularity baseline, combined into a hybrid score. Reads/writes under `data/processed/w11/` (train/test splits, user/item factors as `.npy`, city/user index maps) and produces the deployable `data/processed/models/hybrid_artifacts.pkl` bundling CF factors, content representation, popularity stats, and hybrid config.

5. **`notebooks/week12.ipynb`** — graph analytics: builds a city similarity graph (Euclidean/Pearson distance comparisons), computes PageRank/betweenness/closeness centrality, connected components, degree — used to surface "hidden gem" cities.

Inference workflow (served by `api/app/recommender.py`, which reimplements the notebook logic from the pickle):
```
User ID -> CF score -> Content-based score -> Popularity score -> Hybrid score -> Top-K cities
```
Unknown users fall back to popularity ranking (cold-start). Note: `data/processed/w11/*.parquet` are unresolved Git LFS pointers in this checkout — the API derives `cluster_popularity` and CF score bounds approximately from the pickle at startup and reports this via `/model-info.data_quality`.

## Serving layer (api/ + web/)

- `api/app/model_loader.py` loads `hybrid_artifacts.pkl` once at startup (env `MODEL_PATH` overrides the default `api/data/models/` path used inside Docker).
- Tests: `cd api && pytest` (12 tests; conftest auto-points MODEL_PATH at `data/processed/models/hybrid_artifacts.pkl` on a fresh clone).
- `web/` calls the API from the browser via `NEXT_PUBLIC_API_URL` (build-time inlined) and from server components via `API_URL`.

## Reports

`reports/` contains the graded `.docx` deliverables per milestone (W3, W5, W7, W11, W13) — these are write-once submission artifacts, not living docs; don't edit them when changing notebook code.

## Notes for changes

- Any change to an earlier notebook's output schema (column names, parquet paths) must be propagated forward — later notebooks assume exact filenames under `data/processed/` and `data/processed/w11/`.
- `data/raw/` and the Yelp JSON are gitignored/not committed (license restriction) — never assume raw JSON is present; guard notebook cells accordingly if editing.
