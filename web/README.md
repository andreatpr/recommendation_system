# City Discovery Engine — Web UI

Next.js (App Router + TypeScript + Tailwind) frontend for the recommendation API in `../api/`.
Lets you pick a known user (or type any id to demo the cold-start fallback), compare hybrid vs
popularity rankings side by side, tweak the hybrid weights, and browse the city catalog by cluster.

## Environment variables

| Variable              | Used by                          | Default                 |
|-----------------------|----------------------------------|-------------------------|
| `NEXT_PUBLIC_API_URL` | Browser-side fetches (client components). Inlined at **build** time. | `http://localhost:8000` |
| `API_URL`             | Server-side fetches (server components, e.g. `/catalog`). Read at runtime. | falls back to `NEXT_PUBLIC_API_URL` |

In `docker-compose.yml` these are already wired: the browser hits the API published on the host
(`http://localhost:8000`), while server components use the internal hostname (`http://api:8000`).

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

- `/` — user picker, weight controls, hybrid vs popularity comparison, cold-start banner
- `/catalog` — city catalog with per-cluster filter (`?cluster=N`)
