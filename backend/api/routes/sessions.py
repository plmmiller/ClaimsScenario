from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.deps import get_current_user
from db import queries
from engine import scenario_loader
from engine.phase_manager import get_phase_order_for_scenario

router = APIRouter()


class CreateSessionRequest(BaseModel):
    scenario_id: str
    mode: str  # learning, assessment, hybrid
    difficulty: str  # guided, standard, advanced
    level: str  # beginner, intermediate, experienced


class UpdateSessionRequest(BaseModel):
    status: str  # paused, active, abandoned


@router.post("")
async def create_session(req: CreateSessionRequest, user: dict = Depends(get_current_user)):
    scenario = scenario_loader.get_scenario(req.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if req.mode not in ("learning", "assessment", "hybrid"):
        raise HTTPException(status_code=400, detail="Invalid mode")
    if req.difficulty not in ("guided", "standard", "advanced"):
        raise HTTPException(status_code=400, detail="Invalid difficulty")
    if req.level not in ("beginner", "intermediate", "experienced"):
        raise HTTPException(status_code=400, detail="Invalid level")

    # Determine the first phase for this scenario type
    phase_order = get_phase_order_for_scenario(scenario)
    first_phase = phase_order[0] if phase_order else "fnol"

    session = queries.create_session(user["id"], req.scenario_id, req.mode, req.difficulty, req.level, first_phase)
    return session


@router.get("")
async def list_sessions(limit: int = 20, offset: int = 0, user: dict = Depends(get_current_user)):
    sessions = queries.get_user_sessions(user["id"], limit, offset)
    return sessions


@router.get("/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"] and user["role"] not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    messages = queries.get_messages(session_id, limit=50)
    return {"session": session, "messages": messages}


@router.patch("/{session_id}")
async def update_session(session_id: str, req: UpdateSessionRequest, user: dict = Depends(get_current_user)):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if req.status not in ("paused", "active", "abandoned"):
        raise HTTPException(status_code=400, detail="Invalid status")
    updated = queries.update_session(session_id, {"status": req.status})
    return updated


@router.delete("/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    queries.delete_session(session_id)
    return {"ok": True}
