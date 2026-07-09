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

## Run with Docker

Build and start the complete application (API + frontend):

```bash
docker compose up --build
```

Once the containers are running:

- **Swagger UI:** http://localhost:8000/docs
- **API:** http://localhost:8000
- **Frontend:** http://localhost:3100

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

```text
25 passed
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Checks service availability and verifies that the recommendation model has been successfully loaded. |
| GET | `/model-info` | Returns model configuration, hybrid weights, evaluation metrics, and data-quality information. |
| GET | `/recommendations/{user_id}` | Returns hybrid recommendations for users in the training set. Unknown users automatically receive the popularity-based fallback. |
| POST | `/recommendations/preferences` | Generates recommendations for a new user from a list of `(city, rating)` preferences. |
| GET | `/recommendations/popularity` | Returns the popularity-based baseline ranking. |
| GET | `/cities` | Returns the city catalog, optionally filtered by cluster. |
| GET | `/users/sample` | Returns sample user identifiers available for testing. |

City objects returned by `/cities` and recommendation responses include the following metadata:

- `avg_rating`
- `reviewers`
- `popularity`
- `badge`

where `badge` is:

- `"popular"`: city belongs to the top reviewer quartile.
- `"hidden_gem"`: city has a high average rating but relatively few reviewers.

---

## Recommendation strategies

### Known users

Recommendations follow the hybrid scoring function:

- **Collaborative Filtering (85%)**
- **Content-Based Filtering (5%)**
- **Cluster Popularity (10%)**

The API reproduces the recommendation pipeline implemented in
`notebooks/w10.ipynb`.

Candidate cities are filtered using the original training interactions stored in
`w10_train_uc.parquet`, preventing recommendations of cities already present in
the user's training history.

---

### New users (Cold Start)

Since new users do not have latent factors learned by the SVD model,
collaborative filtering cannot be computed.

Instead, the API:

1. Builds a temporary user profile as the weighted average of the rated cities'
   PCA embeddings.
2. Uses weights equal to:

   ```
   rating × log1p(n_reviews)
   ```

   matching the cold-start strategy implemented in `w10.ipynb`.

3. Computes cosine similarity between the temporary profile and every unseen
   candidate city.
4. Combines the content similarity score with cluster-normalized popularity,
   reconstructed from `w10_user_city_f.parquet`.
5. Returns the Top-K ranked recommendations.

The default scoring function is:

- **Content Similarity (70%)**
- **Cluster Popularity (30%)**

Example request:

```bash
curl -X POST http://localhost:8000/recommendations/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {"city":"west chester","rating":5},
      {"city":"exton","rating":4}
    ],
    "k":10
  }'
```

Valid city names can be obtained from:

```
GET /cities
```

---

## Current limitations

- The recommendation model is pre-trained and performs inference only; it is not updated online.
- Recommendations for new users do not use collaborative filtering because no latent user representation exists before interaction history is collected.
- The temporary profile created for new users exists only during the current request and is not persisted for future sessions.