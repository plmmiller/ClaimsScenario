from __future__ import annotations

"""Coaching utilities for learning and hybrid modes."""

from engine.phase_manager import PHASE_LABELS, is_coaching_allowed


def get_phase_intro_coaching(phase: str, difficulty: str) -> str | None:
    """Return introductory coaching text when entering a new phase (guided/learning mode)."""
    intros = {
        "fnol": (
            "You're beginning the First Notice of Loss (FNOL) phase. "
            "Your insured, Sarah Mitchell, is calling to report the accident. "
            "Focus on gathering all essential facts: date, time, location, parties involved, "
            "injuries, and vehicle information. Use open-ended questions to let her tell her story, "
            "then follow up with specific questions to fill any gaps."
        ),
        "coverage": (
            "Now you'll verify coverage. Review the policy declarations page to determine "
            "which coverages apply. Check for: collision, comprehensive, liability, UM/UIM, "
            "medical payments. Look for any endorsements, exclusions, or coverage issues "
            "like lapsed premiums or excluded drivers."
        ),
        "investigation": (
            "Time to investigate the claim. You'll interview parties, review documents, "
            "and analyze evidence for consistency. Interview Sarah Mitchell, James Torres, "
            "and the witness Linda Park. Review the police report and photos. "
            "Look for inconsistencies and red flags."
        ),
        "liability": (
            "Based on your investigation, determine fault allocation. California follows "
            "pure comparative negligence — each party is responsible for their percentage "
            "of fault. Analyze the facts, apply the negligence standard, and assign fault "
            "percentages. Document your rationale."
        ),
        "damages": (
            "Evaluate vehicle damage and bodily injury claims. Review repair estimates, "
            "determine if vehicles are repairable or total losses, evaluate medical records "
            "for causation and reasonableness, and calculate special and general damages."
        ),
        "negotiation": (
            "Prepare your settlement evaluation with a range (low, target, high authority). "
            "Present and justify your offer. Be prepared for counteroffers. "
            "Know when to hold firm and when to adjust based on the strength of the claim."
        ),
        "resolution": (
            "Close the claim file. Issue payment, obtain a signed release, check for "
            "subrogation potential, ensure all documentation is complete, verify reserves "
            "were set appropriately, and close with proper coding."
        ),
    }
    return intros.get(phase)
