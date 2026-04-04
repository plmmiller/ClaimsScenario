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


def create_scoring_event(
    dimension: str,
    score: int,
    action_description: str,
    feedback: str,
    phase: str,
    rubric_criteria: str | None = None,
) -> dict:
    """Create a new scoring event."""
    return {
        "dimension": dimension,
        "score": score,
        "max_score": 4,
        "action_description": action_description,
        "feedback": feedback,
        "rubric_criteria": rubric_criteria or "",
        "phase": phase,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def compute_dimension_scores(scoring_events: list[dict]) -> dict:
    """Compute average scores per dimension from accumulated events."""
    dimension_totals: dict[str, list[int]] = {}

    for event in scoring_events:
        dim = event["dimension"]
        if dim not in dimension_totals:
            dimension_totals[dim] = []
        dimension_totals[dim].append(event["score"])

    scores = {}
    for dim, weight in DIMENSION_WEIGHTS.items():
        if dim in dimension_totals:
            values = dimension_totals[dim]
            avg = sum(values) / len(values)
            scores[dim] = {
                "label": DIMENSION_LABELS[dim],
                "average_score": round(avg, 2),
                "count": len(values),
                "weight": weight,
                "weighted_score": round(avg * weight, 2),
                "level": SCORE_LEVELS.get(round(avg), "developing"),
            }
        else:
            scores[dim] = {
                "label": DIMENSION_LABELS[dim],
                "average_score": 0,
                "count": 0,
                "weight": weight,
                "weighted_score": 0,
                "level": "not_assessed",
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
