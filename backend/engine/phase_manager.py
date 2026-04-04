from __future__ import annotations

"""Manages phase transitions and validates phase ordering."""

from datetime import datetime, timezone

PHASE_ORDER = [
    "fnol",
    "coverage",
    "investigation",
    "liability",
    "damages",
    "negotiation",
    "resolution",
]

PHASE_LABELS = {
    "fnol": "First Notice of Loss",
    "coverage": "Coverage Verification",
    "investigation": "Investigation",
    "liability": "Liability Determination",
    "damages": "Damage Assessment & Valuation",
    "negotiation": "Negotiation & Settlement",
    "resolution": "Resolution & Closing",
}

# Hybrid mode: coaching available only in these phases
HYBRID_COACHING_PHASES = {"fnol", "coverage", "investigation"}


def validate_transition(from_phase: str, to_phase: str) -> bool:
    """Check that the phase transition follows the required order."""
    if from_phase not in PHASE_ORDER or to_phase not in PHASE_ORDER:
        return False
    from_idx = PHASE_ORDER.index(from_phase)
    to_idx = PHASE_ORDER.index(to_phase)
    return to_idx == from_idx + 1


def get_next_phase(current_phase: str) -> str | None:
    """Return the next phase in the lifecycle, or None if at the end."""
    if current_phase not in PHASE_ORDER:
        return None
    idx = PHASE_ORDER.index(current_phase)
    if idx >= len(PHASE_ORDER) - 1:
        return None
    return PHASE_ORDER[idx + 1]


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
