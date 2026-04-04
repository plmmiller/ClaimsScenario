from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user
from db import queries
from engine.report_generator import generate_report

router = APIRouter()


@router.post("/{session_id}/generate-report")
async def create_report(session_id: str, user: dict = Depends(get_current_user)):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"] and user["role"] not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Session must be completed first")
    if session["mode"] == "learning":
        raise HTTPException(status_code=400, detail="Reports are only available for assessment and hybrid modes")

    existing = queries.get_report(session_id)
    if existing:
        return existing

    report_data = await generate_report(session)
    report = queries.save_report(session_id, user["id"], report_data)
    return report


@router.get("/{session_id}/report")
async def get_report(session_id: str, user: dict = Depends(get_current_user)):
    session = queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user["id"] and user["role"] not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    report = queries.get_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
