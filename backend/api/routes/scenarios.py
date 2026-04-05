from __future__ import annotations

from fastapi import APIRouter

from engine import scenario_loader

router = APIRouter()


@router.get("")
async def list_scenarios():
    scenarios = scenario_loader.get_all_scenarios()
    result = []
    for s in scenarios:
        phases = s.get("phases", {})
        phase_list = list(phases.keys()) if isinstance(phases, dict) else phases
        result.append({
            "id": s["id"],
            "title": s["title"],
            "description": s["description"],
            "difficulty_range": s.get("difficulty_range", ["guided", "standard", "advanced"]),
            "estimated_duration": s.get("estimated_duration", {}),
            "phases": phase_list,
        })
    return result


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    scenario = scenario_loader.get_scenario(scenario_id)
    if not scenario:
        return {"error": "Scenario not found"}, 404
    # Return metadata without rubrics (don't expose scoring criteria)
    return {
        "id": scenario["id"],
        "title": scenario["title"],
        "description": scenario["description"],
        "difficulty_range": scenario["difficulty_range"],
        "estimated_duration": scenario["estimated_duration"],
        "jurisdiction": scenario["jurisdiction"],
        "learning_objectives": scenario["learning_objectives"],
        "phases": {
            phase_id: {
                "available_personas": phase["available_personas"],
                "available_evidence": phase["available_evidence"],
            }
            for phase_id, phase in scenario["phases"].items()
        },
        "personas": [
            {"id": p["id"], "name": p["name"], "role": p["role"]}
            for p in scenario["personas"].values()
        ],
    }
