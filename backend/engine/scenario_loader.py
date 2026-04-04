from __future__ import annotations

import os
from pathlib import Path

import yaml

_scenarios: dict[str, dict] = {}

SCENARIOS_DIR = Path(__file__).parent.parent.parent / "scenarios"


def load_all():
    """Load all scenario directories at startup."""
    global _scenarios
    _scenarios = {}

    if not SCENARIOS_DIR.exists():
        return

    for scenario_dir in SCENARIOS_DIR.iterdir():
        if not scenario_dir.is_dir():
            continue
        scenario_file = scenario_dir / "scenario.yaml"
        if not scenario_file.exists():
            continue

        with open(scenario_file) as f:
            scenario = yaml.safe_load(f)

        # Load personas
        personas = {}
        personas_dir = scenario_dir / "personas"
        if personas_dir.exists():
            for pf in personas_dir.glob("*.yaml"):
                with open(pf) as f:
                    persona = yaml.safe_load(f)
                personas[persona["id"]] = persona
        scenario["personas"] = personas

        # Load evidence documents
        evidence = {}
        evidence_dir = scenario_dir / "evidence"
        if evidence_dir.exists():
            for ef in evidence_dir.glob("*.md"):
                doc_id = ef.stem
                evidence[doc_id] = ef.read_text()
        scenario["evidence"] = evidence

        # Load rubrics
        rubrics = {}
        rubrics_dir = scenario_dir / "rubrics"
        if rubrics_dir.exists():
            for rf in rubrics_dir.glob("*.yaml"):
                with open(rf) as f:
                    rubrics[rf.stem] = yaml.safe_load(f)
        scenario["rubrics"] = rubrics

        # Load tier overrides
        tiers = {}
        tiers_dir = scenario_dir / "tiers"
        if tiers_dir.exists():
            for tf in tiers_dir.glob("*.yaml"):
                with open(tf) as f:
                    tiers[tf.stem] = yaml.safe_load(f)
        scenario["tiers"] = tiers

        _scenarios[scenario["id"]] = scenario


def get_scenario(scenario_id: str) -> dict | None:
    return _scenarios.get(scenario_id)


def get_all_scenarios() -> list[dict]:
    return list(_scenarios.values())


def get_evidence(scenario_id: str, document_id: str) -> str | None:
    scenario = _scenarios.get(scenario_id)
    if not scenario:
        return None
    return scenario.get("evidence", {}).get(document_id)


def get_persona(scenario_id: str, persona_id: str) -> dict | None:
    scenario = _scenarios.get(scenario_id)
    if not scenario:
        return None
    return scenario.get("personas", {}).get(persona_id)
