from __future__ import annotations

from fastapi import APIRouter, Depends

from api.deps import get_current_user

router = APIRouter()


@router.post("/verify")
async def verify_token(user: dict = Depends(get_current_user)):
    return {"user": user}
