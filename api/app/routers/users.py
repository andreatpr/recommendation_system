from __future__ import annotations

from fastapi import APIRouter, Query, Request

from ..schemas import SampleUsersResponse

router = APIRouter(prefix="/users")


@router.get("/sample", response_model=SampleUsersResponse)
def get_sample_users(request: Request, n: int = Query(10, ge=1, le=50)) -> SampleUsersResponse:
    state = request.app.state.model
    user_ids = list(state.user_to_idx.keys())[:n]
    return SampleUsersResponse(user_ids=user_ids)
