from __future__ import annotations

"""Manages phase transitions and validates phase ordering."""

from datetime import datetime, timezone

# Phase orders for different scenario types
SCENARIO_PHASE_ORDERS: dict[str, list[str]] = {
    "claims": [
        "fnol",
        "coverage",
        "investigation",
        "liability",
        "damages",
        "negotiation",
        "resolution",
    ],
    "underwriting": [
        "submission_review",
        "risk_assessment",
        "loss_history",
        "pricing",
        "terms_conditions",
        "negotiation",
        "binding",
    ],
    "marketing": [
        "market_research",
        "strategy_development",
        "content_creation",
        "agency_enablement",
        "campaign_launch",
        "performance_tracking",
        "reporting",
    ],
}

# Default phase order (claims) for backward compatibility
PHASE_ORDER = SCENARIO_PHASE_ORDERS["claims"]

PHASE_LABELS = {
    # Claims
    "fnol": "First Notice of Loss",
    "coverage": "Coverage Verification",
    "investigation": "Investigation",
    "liability": "Liability Determination",
    "damages": "Damage Assessment & Valuation",
    # Underwriting
    "submission_review": "Submission Review",
    "risk_assessment": "Risk Assessment",
    "loss_history": "Loss History Analysis",
    "pricing": "Pricing & Rating",
    "terms_conditions": "Terms & Conditions",
    "binding": "Binding & Issuance",
    # Marketing
    "market_research": "Market Research",
    "strategy_development": "Strategy Development",
    "content_creation": "Content Creation",
    "agency_enablement": "Agency Enablement",
    "campaign_launch": "Campaign Launch",
    "performance_tracking": "Performance Tracking",
    "reporting": "Reporting & ROI",
    # Shared
    "negotiation": "Negotiation",
    "resolution": "Resolution & Closing",
}

# Hybrid mode: coaching available only in the first 3 phases of any scenario
HYBRID_COACHING_PHASES = {"fnol", "coverage", "investigation",
                          "submission_review", "risk_assessment", "loss_history",
                          "market_research", "strategy_development", "content_creation"}


def get_phase_order_for_scenario(scenario: dict) -> list[str]:
    """Determine the phase order from the scenario definition."""
    phases = scenario.get("phases", {})
    if isinstance(phases, dict):
        phase_keys = list(phases.keys())
    elif isinstance(phases, list):
        phase_keys = phases
    else:
        phase_keys = []

    # Try to match to a known scenario type
    for order in SCENARIO_PHASE_ORDERS.values():
        if phase_keys and phase_keys[0] in order:
            return order

    # Fallback: use the phases from the scenario in order
    return phase_keys if phase_keys else PHASE_ORDER


def validate_transition(from_phase: str, to_phase: str, phase_order: list[str] | None = None) -> bool:
    """Check that the phase transition follows the required order."""
    order = phase_order or PHASE_ORDER
    if from_phase not in order or to_phase not in order:
        return False
    from_idx = order.index(from_phase)
    to_idx = order.index(to_phase)
    return to_idx == from_idx + 1


def get_next_phase(current_phase: str, phase_order: list[str] | None = None) -> str | None:
    """Return the next phase in the lifecycle, or None if at the end."""
    order = phase_order or PHASE_ORDER
    if current_phase not in order:
        return None
    idx = order.index(current_phase)
    if idx >= len(order) - 1:
        return None
    return order[idx + 1]


def is_coaching_allowed(mode: str, current_phase: str) -> bool:
    """Check whether coaching is allowed given the mode and phase."""
    if mode == "learning":
        return True
    if mode == "hybrid":
        return current_phase in HYBRID_COACHING_PHASES
    return False  # assessment mode


def update_phase_history(phase_history: list[dict], from_phase: str, to_phase: str, summary: str) -> list[dict]:
    """Update the phase history when transitioning phases."""
    now = datetime.now(timezone.utc).isoformat()

    # Close the current phase
    for entry in phase_history:
        if entry["phase"] == from_phase and entry.get("exited_at") is None:
            entry["exited_at"] = now
            entry["completion_summary"] = summary
            break

    # Open the new phase
    phase_history.append({
        "phase": to_phase,
        "entered_at": now,
        "exited_at": None,
        "completion_summary": None,
    })

    return phase_history
