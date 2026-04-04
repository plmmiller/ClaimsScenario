from __future__ import annotations

from pydantic import BaseModel


class Persona(BaseModel):
    id: str
    name: str
    role: str
    avatar_color: str
    background: dict
    personality: dict
    knowledge: dict
    tier_overrides: dict
    voice_examples: list[str]


class Phase(BaseModel):
    available_personas: list[str]
    available_evidence: list[str]
    required_actions: list[str]
    learning_objectives: list[str]


class Scenario(BaseModel):
    id: str
    title: str
    description: str
    version: str
    difficulty_range: list[str]
    estimated_duration: dict
    jurisdiction: str
    learning_objectives: list[str]
    fact_pattern: dict
    phases: dict[str, Phase]
    personas: dict[str, Persona]
    evidence: dict[str, str]
    rubrics: dict[str, dict]
    tiers: dict[str, dict]
