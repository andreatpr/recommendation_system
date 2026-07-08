# City Discovery Engine API

FastAPI service that serves `data/processed/models/hybrid_artifacts.pkl` (trained in
`notebooks/w10.ipynb`) for city recommendations. No training happens here.

## Run locally (without Docker)

```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-api.txt
MODEL_PATH=../data/processed/models/hybrid_artifacts.pkl uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs

## Run tests

From the `api/` directory (the suite auto-detects the model at
`../data/processed/models/hybrid_artifacts.pkl` when `MODEL_PATH` is not set):

```
cd api
pip install -r requirements-api.txt   # if not already installed
pytest
```

Expected: `12 passed`. To point the tests at a different artifact:

```
MODEL_PATH=/path/to/hybrid_artifacts.pkl pytest
```

Inside the Docker image (model is baked in at `/srv/data/models/`):

```
docker compose run --rm api pytest
```

## Endpoints

| Method | Path                          | Description                                              |
|--------|-------------------------------|------------------------------------------------------------|
| GET    | `/health`                     | Liveness + whether the model is loaded                     |
| GET    | `/model-info`                 | Model shape, hybrid weights, reported metrics, data quality |
| GET    | `/recommendations/{user_id}`  | Hybrid recommendations; falls back to popularity for unknown users (cold-start) |
| GET    | `/recommendations/popularity` | Pure popularity baseline                                    |
| GET    | `/cities`                     | City catalog, optionally filtered by `cluster`              |
| GET    | `/users/sample`               | Sample of known user_ids, useful for trying the API          |

## Known limitations (see `/model-info.data_quality`)

`data/processed/w11/*.parquet` are unresolved Git LFS pointers in this repo, so two things the
original notebook computed exactly are approximated instead:

- **Cluster popularity**: approximated from `city_popularity.baseline_score` (in the pickle),
  normalized per cluster, instead of the notebook's `user_city_f`-derived score.
- **Seen-city exclusion**: not available — recommendations may include cities a user already
  rated, since that requires `train_uc.parquet`.

Both are documented, not silently hidden. Resolving `git lfs pull` and switching to the exact
notebook logic is a follow-up, not implemented here.
