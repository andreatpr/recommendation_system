from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .model_loader import load_model_state
from .routers import cities, health, model_info, recommendations, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model_state()
    yield


app = FastAPI(title="City Discovery Engine API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3100",
        "http://127.0.0.1:3100",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):(3000|3100)$",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")


app.include_router(health.router)
app.include_router(model_info.router)
app.include_router(recommendations.router)
app.include_router(cities.router)
app.include_router(users.router)
