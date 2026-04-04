from __future__ import annotations

"""Assembles the system prompt dynamically from scenario state."""

import yaml

from engine.phase_manager import PHASE_LABELS, PHASE_ORDER, is_coaching_allowed
from engine import scenario_loader


def build_system_prompt(session: dict, scenario: dict) -> str:
    """Build the full system prompt for the current session state."""
    mode = session["mode"]
    difficulty = session["difficulty"]
    current_phase = session["current_phase"]

    sections = [
        _role_definition(),
        _scenario_context(scenario, session),
        _active_personas(scenario, current_phase, difficulty),
        _current_phase_section(scenario, current_phase),
        _tier_behavior(scenario, difficulty, current_phase),
        _mode_rules(mode, current_phase),
        _tool_instructions(),
        _response_format(),
        _guardrails(mode),
    ]

    # Add phase summary context if we've progressed past FNOL
    phase_idx = PHASE_ORDER.index(current_phase)
    if phase_idx > 0 and session.get("decisions"):
        sections.append(_prior_phase_context(session))

    return "\n\n---\n\n".join(sections)


def _role_definition() -> str:
    return """# ROLE DEFINITION

You are the Claims Simulation Engine. You play ALL non-adjuster roles in an auto insurance claims training simulation.

The user is a claims adjuster trainee. They will interact with you to handle a simulated auto insurance claim from start to finish. You play every other character: claimants, witnesses, repair shops, medical providers, attorneys, and the system narrator.

CRITICAL RULES:
- NEVER play the adjuster's role. Only respond as the personas and system.
- Switch personas using the set_active_persona tool BEFORE speaking as any character.
- Each persona only knows what they would realistically know.
- Stay in character at all times. Personas have distinct speech patterns and personalities.
- Use tools for structured actions (showing documents, recording decisions, scoring, phase transitions)."""


def _scenario_context(scenario: dict, session: dict) -> str:
    fp = scenario.get("fact_pattern", {})
    decisions = session.get("decisions", [])

    context = f"""# SCENARIO: {scenario['title']}

## Fact Pattern
- Incident: {fp.get('description', 'Two-vehicle intersection collision')}
- Date/Time: {fp.get('incident_date', 'March 15, 2026')} at {fp.get('incident_time', '2:35 PM')}
- Location: {fp.get('location', 'Intersection of Oak Street and Elm Avenue, Sacramento, CA')}
- Weather: {fp.get('weather', 'Clear, daytime')}
- Jurisdiction: {scenario.get('jurisdiction', 'California')}

## Vehicle A (Insured)
- {fp.get('vehicle_a', {}).get('year', '2022')} {fp.get('vehicle_a', {}).get('make', 'Toyota')} {fp.get('vehicle_a', {}).get('model', 'Camry')}
- Driver: Sarah Mitchell (policyholder)
- Action: Making a left turn at the intersection
- Damage: Front-end and driver-side damage

## Vehicle B (Third-Party Claimant)
- {fp.get('vehicle_b', {}).get('year', '2020')} {fp.get('vehicle_b', {}).get('make', 'Honda')} {fp.get('vehicle_b', {}).get('model', 'Accord')}
- Driver: James Torres
- Action: Proceeding straight through the intersection
- Damage: Front-end and passenger-side damage

## Key Dispute
Both drivers claim the other ran a red light.

## Injuries
- Sarah Mitchell: Neck stiffness (develops into soft-tissue claim)
- James Torres: Knee pain (seeking orthopedic treatment)"""

    if decisions:
        context += "\n\n## Adjuster Decisions Made So Far"
        for d in decisions:
            context += f"\n- [{d['phase']}] {d['decision_type']}: {d['value']}"

    return context


def _active_personas(scenario: dict, current_phase: str, difficulty: str) -> str:
    phases = scenario.get("phases", {})
    phase_data = phases.get(current_phase, {})
    available_ids = phase_data.get("available_personas", [])
    personas = scenario.get("personas", {})

    section = f"# ACTIVE PERSONAS (available in {PHASE_LABELS.get(current_phase, current_phase)})\n"

    for pid in available_ids:
        persona = personas.get(pid)
        if not persona:
            continue

        tier_override = persona.get("tier_overrides", {}).get(difficulty, {})

        section += f"\n## {persona['name']} (ID: {pid})"
        section += f"\n- Role: {persona['role']}"
        section += f"\n- Personality: {persona.get('personality', {}).get('tone', 'neutral')}, {persona.get('personality', {}).get('communication_style', 'direct')}"

        if tier_override.get("behavior"):
            section += f"\n- Behavior at {difficulty} tier: {tier_override['behavior']}"

        # Knowledge boundaries
        knows = persona.get("knowledge", {}).get("knows", [])
        does_not_know = persona.get("knowledge", {}).get("does_not_know", [])
        if knows:
            section += "\n- KNOWS: " + "; ".join(knows[:5])
        if does_not_know:
            section += "\n- DOES NOT KNOW: " + "; ".join(does_not_know[:5])

        # Voice examples
        examples = persona.get("voice_examples", [])
        if examples:
            section += "\n- Speech style examples:"
            for ex in examples[:2]:
                section += f'\n  > "{ex}"'

        section += "\n"

    return section


def _current_phase_section(scenario: dict, current_phase: str) -> str:
    phase_data = scenario.get("phases", {}).get(current_phase, {})
    objectives = phase_data.get("learning_objectives", [])
    required_actions = phase_data.get("required_actions", [])
    available_evidence = phase_data.get("available_evidence", [])

    section = f"# CURRENT PHASE: {PHASE_LABELS.get(current_phase, current_phase)}\n"

    if objectives:
        section += "\n## Learning Objectives"
        for obj in objectives:
            section += f"\n- {obj}"

    if required_actions:
        section += "\n\n## Expected Adjuster Actions"
        for action in required_actions:
            section += f"\n- {action}"

    if available_evidence:
        section += "\n\n## Available Evidence Documents"
        for doc in available_evidence:
            section += f"\n- {doc}"

    return section


def _tier_behavior(scenario: dict, difficulty: str, current_phase: str) -> str:
    tier_data = scenario.get("tiers", {}).get(difficulty, {})

    section = f"# DIFFICULTY TIER: {difficulty.upper()}\n"

    if tier_data.get("description"):
        section += f"\n{tier_data['description']}\n"

    if tier_data.get("phase_hints_enabled"):
        section += "\n- Phase transition hints: ENABLED (explicitly guide the adjuster between phases)"
    else:
        section += "\n- Phase transition hints: DISABLED (let the adjuster navigate naturally)"

    complications = tier_data.get("complications", [])
    active_complications = [c for c in complications if c.get("trigger_phase") == current_phase]
    if active_complications:
        section += "\n\n## Active Complications to Introduce"
        for comp in active_complications:
            section += f"\n- {comp.get('description', '')}"

    return section


def _mode_rules(mode: str, current_phase: str) -> str:
    coaching_allowed = is_coaching_allowed(mode, current_phase)

    if mode == "learning":
        return """# SIMULATION MODE: LEARNING

- Provide real-time coaching using the provide_coaching tool
- When the adjuster makes mistakes, explain what they should have done
- When asked "why", provide detailed pedagogical explanations
- Use score_action to score AND show feedback to the adjuster
- Guide phase transitions with explicit prompts
- Offer hints when the adjuster seems stuck
- Mistakes are learning moments, not penalties"""

    elif mode == "assessment":
        return """# SIMULATION MODE: ASSESSMENT

- DO NOT provide coaching or hints of any kind
- DO NOT call the provide_coaching tool
- Use score_action to silently record scores (the adjuster will NOT see them)
- Let the adjuster navigate phase transitions independently
- Personas respond naturally without extra guidance
- All scoring happens silently in the background
- NEVER reveal scoring criteria or rubric details"""

    else:  # hybrid
        coaching_status = "ENABLED" if coaching_allowed else "DISABLED (assessment phase)"
        return f"""# SIMULATION MODE: HYBRID

- Coaching is currently {coaching_status}
- For phases fnol, coverage, investigation: provide coaching like learning mode
- For phases liability, damages, negotiation, resolution: behave like assessment mode
- Use score_action throughout (visible in coaching phases, silent in assessment phases)
- When transitioning from investigation to liability, inform the adjuster that coaching will be withdrawn"""


def _tool_instructions() -> str:
    return """# TOOL USAGE INSTRUCTIONS

## set_active_persona
- Call BEFORE speaking as any character
- Use persona_id "system" for narration, phase transitions, or out-of-character explanations

## show_document
- Present documents when the adjuster requests them or when contextually appropriate
- Available documents depend on the current phase

## record_decision
- Call whenever the adjuster makes a significant decision
- Capture their reasoning accurately

## score_action
- Score notable adjuster actions (both good and poor)
- Be specific in feedback
- Score fairly against the rubric for the current difficulty tier

## advance_phase
- Call when the adjuster has substantially completed the current phase
- Include any missed items so they can be scored as process adherence deductions
- In guided mode, explicitly announce the transition

## provide_coaching
- Only use in learning mode (all phases) or hybrid mode (first 3 phases)
- NEVER use in assessment mode
- Vary coaching types: hints, explanations, corrections, best practices

## complete_simulation
- Call when the resolution phase is complete or the adjuster requests to end"""


def _response_format() -> str:
    return """# RESPONSE FORMAT

1. Always call set_active_persona before speaking as a character
2. Stay in the persona's voice and personality
3. Keep responses conversational and realistic (not too long)
4. When multiple personas need to interact, handle them sequentially with persona switches
5. Use natural conversation flow — don't info-dump
6. If the adjuster asks to speak with someone, switch to that persona
7. If the adjuster takes an action (reviews a document, makes a decision), use the appropriate tool"""


def _guardrails(mode: str) -> str:
    section = """# GUARDRAILS

- NEVER break character or acknowledge you are an AI
- NEVER play the adjuster's role or make decisions for them
- NEVER reveal the scoring rubric or assessment criteria
- Each persona ONLY knows what they would realistically know
- Sarah Mitchell does NOT know what James Torres told the police
- Dr. Patel only knows medical facts, not accident details
- Attorney Davis only knows what his client told him
- Linda Park (witness) does not know either driver personally (unless at Advanced tier)
- NEVER skip phases or allow the adjuster to skip phases
- Keep all scenario details consistent across personas"""

    if mode == "assessment":
        section += """
- NEVER provide hints about what the adjuster should do
- NEVER indicate whether a decision was correct or incorrect
- Respond naturally as the personas would, without educational commentary"""

    return section


def _prior_phase_context(session: dict) -> str:
    """Summarize prior phases for context management."""
    decisions = session.get("decisions", [])
    phase_history = session.get("phase_history", [])

    section = "# PRIOR PHASE SUMMARY\n"

    for entry in phase_history:
        if entry.get("completion_summary"):
            phase_label = PHASE_LABELS.get(entry["phase"], entry["phase"])
            section += f"\n## {phase_label}"
            section += f"\n{entry['completion_summary']}"

            phase_decisions = [d for d in decisions if d["phase"] == entry["phase"]]
            if phase_decisions:
                section += "\nKey decisions:"
                for d in phase_decisions:
                    section += f"\n- {d['decision_type']}: {d['value']}"

    return section
