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
| POST   | `/recommendations/preferences`| Personalized recommendations for a new user from a list of (city, rating) preferences |
| GET    | `/recommendations/popularity` | Pure popularity baseline                                    |
| GET    | `/cities`                     | City catalog, optionally filtered by `cluster`              |
| GET    | `/users/sample`               | Sample of known user_ids, useful for trying the API          |

City objects in `/cities` and in recommendation responses include enrichment fields derived
from the pickle at startup: `avg_rating`, `reviewers`, `popularity` (0-1, globally normalized
baseline score) and `badge` (`"popular"` = top-quartile reviewer count; `"hidden_gem"` =
top-quartile rating with bottom-quartile reviewers; otherwise `null`).

### POST /recommendations/preferences

Cold-start-by-design: builds a content profile as the weighted average of the rated cities'
PCA embeddings (weights = `rating * log1p(n_reviews)`, mirroring the w10.ipynb cold-start
demo) and scores candidates with `0.7 * cosine + 0.3 * popularity`. No CF term — a new user
has no latent factors. Rated cities are excluded from the results. Unknown city names return
422 listing the invalid names; city matching is case-insensitive. Note: this path is POST-only;
a GET to the same URL matches `/recommendations/{user_id}` and returns the cold-start fallback.

```bash
curl -X POST http://localhost:8000/recommendations/preferences \
  -H 'Content-Type: application/json' \
  -d '{"preferences":[{"city":"west chester","rating":5},{"city":"exton","rating":4}],"k":10}'
```

(Valid city names come from `GET /cities` — the catalog covers the metro areas present in the
filtered Yelp dataset, e.g. `west chester`, `exton`, `st petersburg`; `tampa` is not in it.)

## Known limitations (see `/model-info.data_quality`)

`data/processed/w11/*.parquet` are unresolved Git LFS pointers in this repo, so two things the
original notebook computed exactly are approximated instead:

- **Cluster popularity**: approximated from `city_popularity.baseline_score` (in the pickle),
  normalized per cluster, instead of the notebook's `user_city_f`-derived score.
- **Seen-city exclusion**: not available — recommendations may include cities a user already
  rated, since that requires `train_uc.parquet`.

Both are documented, not silently hidden. Resolving `git lfs pull` and switching to the exact
notebook logic is a follow-up, not implemented here.
