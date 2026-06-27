from __future__ import annotations

from fastapi import APIRouter, Depends

from api.deps import require_role
from db import queries
from db.client import get_supabase

router = APIRouter()


@router.get("/analytics")
async def get_analytics(user: dict = Depends(require_role("instructor", "admin"))):
    db = get_supabase()
    sessions = db.table("sessions").select("*").execute().data
    reports = db.table("reports").select("*").execute().data

    total_sessions = len(sessions)
    completed = [s for s in sessions if s["status"] == "completed"]
    active = [s for s in sessions if s["status"] == "active"]

    mode_counts = {}
    difficulty_counts = {}
    for s in sessions:
        mode_counts[s["mode"]] = mode_counts.get(s["mode"], 0) + 1
        difficulty_counts[s["difficulty"]] = difficulty_counts.get(s["difficulty"], 0) + 1

    avg_score = None
    if reports:
        scores = [r["overall_score"] for r in reports if r.get("overall_score")]
        avg_score = sum(scores) / len(scores) if scores else None

    return {
        "total_sessions": total_sessions,
        "completed_sessions": len(completed),
        "active_sessions": len(active),
        "completion_rate": len(completed) / total_sessions if total_sessions > 0 else 0,
        "mode_distribution": mode_counts,
        "difficulty_distribution": difficulty_counts,
        "average_score": avg_score,
        "total_reports": len(reports),
    }


@router.get("/users")
async def list_users(user: dict = Depends(require_role("instructor", "admin"))):
    profiles = queries.get_all_profiles()
    db = get_supabase()
    for profile in profiles:
        count_result = (
            db.table("sessions")
            .select("id", count="exact")
            .eq("user_id", profile["id"])
            .execute()
        )
        profile["session_count"] = count_result.count or 0
    return profiles


@router.get("/sessions/{session_id}/transcript")
async def get_transcript(session_id: str, user: dict = Depends(require_role("instructor", "admin"))):
    session = queries.get_session(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    messages = queries.get_messages(session_id, limit=1000)
    return {"session": session, "messages": messages}
