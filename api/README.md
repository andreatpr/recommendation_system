# City Discovery Engine API

FastAPI service that serves the pre-trained hybrid recommendation model stored in
`data/processed/models/hybrid_artifacts.pkl`. The recommendation model is trained
offline in `notebooks/w10.ipynb`; therefore, the API performs inference only and
does not retrain or update the model at runtime.

The API supports two recommendation modes:

- **Known users:** recommendations are generated using the hybrid recommender
  (Collaborative Filtering + Content-Based Filtering + Cluster Popularity).
- **New users:** recommendations are generated from a temporary content profile
  built from user-provided city ratings, combined with cluster popularity to
  address the cold-start problem.

---

## Run with Docker only

Build and start the complete application (API + frontend):

```bash
docker compose up --build
```

Once the containers are running:

- **Swagger UI:** http://localhost:8000/docs
- **API:** http://localhost:8000
- **Frontend:** http://localhost:3000

To stop the services:

```bash
docker compose down
```

---

## Run tests

Execute the test suite inside the API container:

```bash
docker compose run --rm api pytest
```

Expected output:

```
12 passed
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Checks service availability and verifies that the recommendation model has been successfully loaded. |
| GET | `/model-info` | Returns model configuration, hybrid weights, evaluation metrics, and data-quality information. |
| GET | `/recommendations/{user_id}` | Returns hybrid recommendations for users present in the training interaction matrix. |
| POST | `/recommendations/new-user` | Generates recommendations for new users from a list of rated cities using a temporary content profile and cluster popularity. |
| GET | `/recommendations/popularity` | Returns the popularity-based baseline ranking. |
| GET | `/cities` | Returns the city catalog, optionally filtered by cluster. |
| GET | `/users/sample` | Returns sample user identifiers available for testing. |

---

## Recommendation strategies

### Known users

Recommendations follow the hybrid scoring function:

- **Collaborative Filtering (85%)**
- **Content-Based Filtering (5%)**
- **Cluster Popularity (10%)**

The API reproduces the recommendation pipeline implemented in
`notebooks/w10.ipynb`, including exclusion of cities already present in the
user's training history (`w10_train_uc.parquet`).

### New users (Cold Start)

Since new users do not have latent factors learned by the SVD model,
collaborative filtering cannot be computed.

Instead, the API:

1. Builds a temporary user profile as the rating-weighted average of the PCA city embeddings.
2. Computes cosine similarity between this profile and every unseen city.
3. Combines content similarity with normalized cluster popularity.
4. Returns the Top-K ranked recommendations.

The default scoring function is:

- **Content Similarity (90%)**
- **Cluster Popularity (10%)**

---

## Current limitations/notes

- Recommendations for new users do not use collaborative filtering because no latent user representation exists before interaction history is collected.
- The temporary profile created for new users exists only during the request and is not persisted. Consequently, subsequent requests do not accumulate user history.