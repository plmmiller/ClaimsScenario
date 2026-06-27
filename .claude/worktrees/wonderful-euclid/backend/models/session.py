from __future__ import annotations

from pydantic import BaseModel


class PhaseEntry(BaseModel):
    phase: str
    entered_at: str
    exited_at: str | None = None
    completion_summary: str | None = None


class Decision(BaseModel):
    id: str
    phase: str
    decision_type: str
    value: str
    rationale: str
    timestamp: str
    score: dict | None = None


class ScoringEvent(BaseModel):
    dimension: str
    score: int
    max_score: int = 4
    action_description: str
    feedback: str
    phase: str
    timestamp: str
