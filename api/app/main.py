from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model_loader import load_model_state
from .routers import cities, health, model_info, recommendations, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model_state()
    yield


app = FastAPI(title="City Discovery Engine API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(model_info.router)
app.include_router(recommendations.router)
app.include_router(cities.router)
app.include_router(users.router)
