from __future__ import annotations

"""Accumulates scoring events and computes dimension scores."""

from datetime import datetime, timezone

DIMENSION_WEIGHTS = {
    "technical_knowledge": 0.25,
    "investigation_quality": 0.20,
    "communication": 0.20,
    "judgment_decision_making": 0.20,
    "process_adherence": 0.10,
    "fraud_awareness": 0.05,
}

DIMENSION_LABELS = {
    "technical_knowledge": "Technical Knowledge",
    "investigation_quality": "Investigation Quality",
    "communication": "Communication",
    "judgment_decision_making": "Judgment & Decision-Making",
    "process_adherence": "Process Adherence",
    "fraud_awareness": "Fraud Awareness",
}

SCORE_LEVELS = {
    4: "exemplary",
    3: "proficient",
    2: "developing",
    1: "needs_improvement",
}

# Import-safe phase labels for scorer display
PHASE_LABELS_FOR_SCORER = {
    "fnol": "First Notice of Loss",
    "coverage": "Coverage Verification",
    "investigation": "Investigation",
    "liability": "Liability Determination",
    "damages": "Damage Assessment",
    "negotiation": "Negotiation",
    "resolution": "Resolution",
    "submission_review": "Submission Review",
    "risk_assessment": "Risk Assessment",
    "loss_history": "Loss History",
    "pricing": "Pricing & Rating",
    "terms_conditions": "Terms & Conditions",
    "binding": "Binding & Issuance",
    "market_research": "Market Research",
    "strategy_development": "Strategy Development",
    "content_creation": "Content Creation",
    "agency_enablement": "Agency Enablement",
    "campaign_launch": "Campaign Launch",
    "performance_tracking": "Performance Tracking",
    "reporting": "Reporting & ROI",
}


def create_scoring_event(
    dimension: str,
    score: int,
    action_description: str,
    feedback: str,
    phase: str,
    rubric_criteria: str | None = None,
    what_was_expected: str | None = None,
    evidence: list[str] | None = None,
    improvement_tip: str | None = None,
) -> dict:
    """Create a new scoring event with detailed explanation."""
    return {
        "dimension": dimension,
        "score": score,
        "max_score": 4,
        "level": SCORE_LEVELS.get(score, "developing"),
        "action_description": action_description,
        "feedback": feedback,
        "rubric_criteria": rubric_criteria or "",
        "what_was_expected": what_was_expected or "",
        "evidence": evidence or [],
        "improvement_tip": improvement_tip or "",
        "phase": phase,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def compute_dimension_scores(scoring_events: list[dict]) -> dict:
    """Compute average scores per dimension from accumulated events."""
    dimension_events: dict[str, list[dict]] = {}

    for event in scoring_events:
        dim = event["dimension"]
        if dim not in dimension_events:
            dimension_events[dim] = []
        dimension_events[dim].append(event)

    scores = {}
    for dim, weight in DIMENSION_WEIGHTS.items():
        if dim in dimension_events:
            events = dimension_events[dim]
            values = [e["score"] for e in events]
            avg = sum(values) / len(values)

            # Build explanation details from individual events
            explanations = []
            for e in events:
                explanations.append({
                    "score": e["score"],
                    "level": SCORE_LEVELS.get(e["score"], "developing"),
                    "action": e.get("action_description", ""),
                    "feedback": e.get("feedback", ""),
                    "what_was_expected": e.get("what_was_expected", ""),
                    "evidence": e.get("evidence", []),
                    "improvement_tip": e.get("improvement_tip", ""),
                    "phase": PHASE_LABELS_FOR_SCORER.get(e.get("phase", ""), e.get("phase", "")),
                    "timestamp": e.get("timestamp", ""),
                })

            # Identify strongest and weakest events for summary
            best_event = max(events, key=lambda e: e["score"])
            worst_event = min(events, key=lambda e: e["score"])

            scores[dim] = {
                "label": DIMENSION_LABELS[dim],
                "average_score": round(avg, 2),
                "count": len(values),
                "weight": weight,
                "weighted_score": round(avg * weight, 2),
                "level": SCORE_LEVELS.get(round(avg), "developing"),
                "explanations": explanations,
                "strongest_action": best_event.get("action_description", ""),
                "weakest_action": worst_event.get("action_description", "") if worst_event["score"] < best_event["score"] else "",
            }
        else:
            scores[dim] = {
                "label": DIMENSION_LABELS[dim],
                "average_score": 0,
                "count": 0,
                "weight": weight,
                "weighted_score": 0,
                "level": "not_assessed",
                "explanations": [],
                "strongest_action": "",
                "weakest_action": "",
            }

    return scores


def compute_overall_score(dimension_scores: dict) -> tuple[float, str]:
    """Compute the weighted overall score and level."""
    total_weighted = sum(d["weighted_score"] for d in dimension_scores.values())
    total_weight = sum(d["weight"] for d in dimension_scores.values() if d["count"] > 0)

    if total_weight == 0:
        return 0.0, "not_assessed"

    overall = total_weighted / total_weight
    overall_rounded = round(overall, 2)

    if overall >= 3.5:
        level = "exemplary"
    elif overall >= 2.5:
        level = "proficient"
    elif overall >= 1.5:
        level = "developing"
    else:
        level = "needs_improvement"

    return overall_rounded, level
