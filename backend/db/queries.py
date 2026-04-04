from __future__ import annotations

from uuid import uuid4
from datetime import datetime, timezone

from db.client import get_supabase


# --- Sessions ---

def create_session(user_id: str, scenario_id: str, mode: str, difficulty: str) -> dict:
    db = get_supabase()
    session = {
        "id": str(uuid4()),
        "user_id": user_id,
        "scenario_id": scenario_id,
        "mode": mode,
        "difficulty": difficulty,
        "current_phase": "fnol",
        "status": "active",
        "phase_history": [{"phase": "fnol", "entered_at": datetime.now(timezone.utc).isoformat(), "exited_at": None}],
        "decisions": [],
        "documents_accessed": [],
        "scoring_events": [],
        "metadata": {},
    }
    result = db.table("sessions").insert(session).execute()
    return result.data[0]


def get_session(session_id: str) -> dict | None:
    db = get_supabase()
    result = db.table("sessions").select("*").eq("id", session_id).maybe_single().execute()
    return result.data


def get_user_sessions(user_id: str, limit: int = 20, offset: int = 0) -> list[dict]:
    db = get_supabase()
    result = (
        db.table("sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("started_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


def update_session(session_id: str, updates: dict) -> dict:
    db = get_supabase()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("sessions").update(updates).eq("id", session_id).execute()
    return result.data[0]


# --- Messages ---

def get_messages(session_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    db = get_supabase()
    result = (
        db.table("messages")
        .select("*")
        .eq("session_id", session_id)
        .order("sequence_num")
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


def get_message_count(session_id: str) -> int:
    db = get_supabase()
    result = db.table("messages").select("id", count="exact").eq("session_id", session_id).execute()
    return result.count or 0


def save_message(session_id: str, role: str, content: str, phase: str,
                 persona: str | None = None, tool_calls: list | None = None,
                 tool_results: list | None = None) -> dict:
    db = get_supabase()
    seq = get_message_count(session_id)
    message = {
        "id": str(uuid4()),
        "session_id": session_id,
        "role": role,
        "persona": persona,
        "content": content,
        "tool_calls": tool_calls,
        "tool_results": tool_results,
        "phase": phase,
        "sequence_num": seq,
    }
    result = db.table("messages").insert(message).execute()
    return result.data[0]


# --- Reports ---

def save_report(session_id: str, user_id: str, report_data: dict) -> dict:
    db = get_supabase()
    report = {
        "id": str(uuid4()),
        "session_id": session_id,
        "user_id": user_id,
        **report_data,
    }
    result = db.table("reports").insert(report).execute()
    return result.data[0]


def get_report(session_id: str) -> dict | None:
    db = get_supabase()
    result = db.table("reports").select("*").eq("session_id", session_id).maybe_single().execute()
    return result.data


# --- Profiles ---

def get_profile(user_id: str) -> dict | None:
    db = get_supabase()
    result = db.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    return result.data


def get_all_profiles(limit: int = 100) -> list[dict]:
    db = get_supabase()
    result = db.table("profiles").select("*").range(0, limit - 1).execute()
    return result.data
