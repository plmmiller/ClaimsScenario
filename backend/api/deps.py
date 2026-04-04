from __future__ import annotations

from fastapi import Depends, HTTPException

from api.middleware.auth import verify_supabase_token
from db.queries import get_profile


async def get_current_user(payload: dict = Depends(verify_supabase_token)) -> dict:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile


def require_role(*roles: str):
    async def check_role(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return check_role
