from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.deps import get_current_user
from db import queries
from engine import scenario_loader
from engine.phase_manager import get_phase_order_for_scenario
from engine.scorer import compute_dimension_scores, compute_overall_score

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


@router.get("/{session_id}/progress")
async def get_progress(session_id: str, user: dict = Depends(get_current_user)):
    """Return progress data: task checklist (learning) and running scores (assessment)."""
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"] and user["role"] not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    scenario = scenario_loader.get_scenario(session["scenario_id"])
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    current_phase = session["current_phase"]
    phase_order = get_phase_order_for_scenario(scenario)
    decisions = session.get("decisions") or []
    scoring_events = session.get("scoring_events") or []

    # Build phase tasks from scenario definition
    phase_tasks = []
    phases_data = scenario.get("phases", [])
    current_phase_data = None
    for p in phases_data:
        if p.get("id") == current_phase:
            current_phase_data = p
            break

    if current_phase_data:
        required_actions = current_phase_data.get("required_actions", [])
        # Match decisions to required actions (fuzzy: check if decision description mentions the action)
        completed_decisions = [d.get("description", "") for d in decisions if d.get("phase") == current_phase]
        for action in required_actions:
            # Check if any decision roughly matches this action
            is_completed = any(
                _fuzzy_match(action, desc) for desc in completed_decisions
            )
            phase_tasks.append({
                "action": action,
                "completed": is_completed,
            })

    # Compute running scores
    dimension_scores = compute_dimension_scores(scoring_events)
    overall_score, overall_level = compute_overall_score(dimension_scores)

    # Phase completion summary
    current_idx = phase_order.index(current_phase) if current_phase in phase_order else 0
    phases_completed = current_idx
    phases_total = len(phase_order)

    return {
        "mode": session["mode"],
        "current_phase": current_phase,
        "phase_tasks": phase_tasks,
        "phases_completed": phases_completed,
        "phases_total": phases_total,
        "dimension_scores": dimension_scores,
        "overall_score": overall_score,
        "overall_level": overall_level,
        "scoring_events_count": len(scoring_events),
    }


def _fuzzy_match(action: str, decision_desc: str) -> bool:
    """Simple fuzzy match: check if key words from the action appear in the decision."""
    if not decision_desc:
        return False
    action_lower = action.lower()
    desc_lower = decision_desc.lower()
    # Extract significant words (>3 chars) from action
    action_words = [w for w in action_lower.split() if len(w) > 3]
    if not action_words:
        return False
    # If more than half the significant words appear in the decision, consider it a match
    matches = sum(1 for w in action_words if w in desc_lower)
    return matches >= len(action_words) * 0.5
