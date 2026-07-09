# City Discovery Engine — Web UI

Next.js (App Router + TypeScript + Tailwind) frontend for the recommendation API in `../api/`.
Main flow: pick 3-5 cities you know, rate them with stars, and get personalized recommendations
compared against the popularity baseline. A secondary academic demo mode keeps the original
dataset-user picker (full hybrid CF + cold-start fallback). Catalog browsing by cluster with
enriched city cards.

## Environment variables

| Variable              | Used by                          | Default                 |
|-----------------------|----------------------------------|-------------------------|
| `NEXT_PUBLIC_API_URL` | Browser-side fetches (client components). Inlined at **build** time. | `http://localhost:8000` |
| `API_URL`             | Server-side fetches (server components, e.g. `/catalog`). Read at runtime. | falls back to `NEXT_PUBLIC_API_URL` |

In `docker-compose.yml` these are already wired: the browser hits the API published on the host
(`http://localhost:8000`), while server components use the internal hostname (`http://api:8000`).
The compose setup publishes the web app on host port **3100** (http://localhost:3100), since
3000 tends to collide with other local projects; `npm run dev` still uses 3000.

## Run in development

The FastAPI backend must be running first (see `../api/README.md`):

```bash
cd api
MODEL_PATH=../data/processed/models/hybrid_artifacts.pkl uvicorn app.main:app --reload
```

Then:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. The dev server points at `http://localhost:8000` by default; override
with `NEXT_PUBLIC_API_URL=http://other-host:8000 npm run dev` if the API lives elsewhere.

## Production build (standalone, used by the Dockerfile)

```bash
npm run build
node .next/standalone/server.js
```

Or just use the compose setup from the repo root: `docker compose up --build`.

## Pages

- `/` — two modes via tabs:
  - **Tus gustos** (default): autocomplete over the 213-city catalog, star ratings per city,
    `POST /recommendations/preferences`, personalized-vs-popularity comparison.
  - **Modo demo académico**: original user_id picker + weight sliders (full hybrid model,
    cold-start banner for unknown ids).
- `/catalog` — city catalog with per-cluster filter (`?cluster=N`), enriched cards
  (avg rating stars, reviewer counts, "Popular"/"Joya oculta" badges)

Key components: `PreferencePicker` (autocomplete + star ratings), `StarRating` (shared,
interactive and read-only fractional), `CityCard`/`RecommendationComparison` (enriched cards
with per-column relative score bars), `SkeletonCard` (loading states).
