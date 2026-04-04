from __future__ import annotations

"""Generates detailed performance reports using a separate Anthropic API call."""

import anthropic

from config import settings
from engine.scorer import compute_dimension_scores, compute_overall_score, DIMENSION_LABELS
from engine.phase_manager import PHASE_LABELS
from db import queries


async def generate_report(session: dict) -> dict:
    """Generate a comprehensive performance report for a completed session."""
    scoring_events = session.get("scoring_events", [])
    decisions = session.get("decisions", [])
    phase_history = session.get("phase_history", [])

    # Compute scores
    dimension_scores = compute_dimension_scores(scoring_events)
    overall_score, overall_level = compute_overall_score(dimension_scores)

    # Get conversation transcript for narrative generation
    messages = queries.get_messages(session["id"], limit=500)

    # Generate narrative analysis via Anthropic API
    narratives = await _generate_narratives(session, messages, scoring_events, decisions)

    # Identify strengths and improvements
    strengths = []
    improvements = []
    for dim, data in dimension_scores.items():
        if data["count"] == 0:
            continue
        if data["average_score"] >= 3.0:
            strengths.append({
                "dimension": DIMENSION_LABELS[dim],
                "score": data["average_score"],
                "detail": _get_best_event(scoring_events, dim),
            })
        elif data["average_score"] < 2.5:
            improvements.append({
                "dimension": DIMENSION_LABELS[dim],
                "score": data["average_score"],
                "detail": _get_worst_event(scoring_events, dim),
            })

    # Generate recommendations
    recommendations = _generate_recommendations(dimension_scores, improvements)

    return {
        "overall_score": overall_score,
        "overall_level": overall_level,
        "dimension_scores": dimension_scores,
        "phase_narratives": narratives,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
    }


async def _generate_narratives(
    session: dict, messages: list, scoring_events: list, decisions: list
) -> dict:
    """Use Claude to generate phase-by-phase narrative analysis."""
    # Build a summary of the session for the narrative prompt
    transcript_summary = []
    for msg in messages[-100:]:  # Last 100 messages for context
        role = msg.get("role", "unknown")
        persona = msg.get("persona", "")
        content = msg.get("content", "")[:200]
        if role == "user":
            transcript_summary.append(f"ADJUSTER: {content}")
        elif role == "assistant" and persona:
            transcript_summary.append(f"{persona.upper()}: {content}")

    decisions_text = "\n".join(
        f"- [{d['phase']}] {d['decision_type']}: {d['value']}" for d in decisions
    )

    events_text = "\n".join(
        f"- [{e['phase']}] {e['dimension']} ({e['score']}/4): {e['action_description']}"
        for e in scoring_events
    )

    prompt = f"""Analyze this claims simulation session and write a brief narrative for each phase the adjuster completed. Focus on what they did well and what they could improve.

Session: {session['mode']} mode, {session['difficulty']} difficulty

Key Decisions:
{decisions_text}

Scoring Events:
{events_text}

Recent Conversation Excerpt:
{chr(10).join(transcript_summary[-30:])}

Write a JSON object with phase IDs as keys and 2-3 sentence narratives as values. Only include phases that were actually completed. Example:
{{"fnol": "The adjuster conducted a thorough intake interview...", "coverage": "Coverage verification was handled well..."}}

Return ONLY the JSON object, no other text."""

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        text = response.content[0].text.strip()
        # Handle potential markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception:
        # Fallback: generate simple narratives from scoring events
        narratives = {}
        for phase_id in PHASE_LABELS:
            phase_events = [e for e in scoring_events if e["phase"] == phase_id]
            if phase_events:
                avg = sum(e["score"] for e in phase_events) / len(phase_events)
                narratives[phase_id] = (
                    f"The adjuster scored an average of {avg:.1f}/4.0 "
                    f"across {len(phase_events)} evaluated actions in this phase."
                )
        return narratives


def _get_best_event(events: list, dimension: str) -> str:
    dim_events = [e for e in events if e["dimension"] == dimension]
    if not dim_events:
        return ""
    best = max(dim_events, key=lambda e: e["score"])
    return best.get("feedback", best.get("action_description", ""))


def _get_worst_event(events: list, dimension: str) -> str:
    dim_events = [e for e in events if e["dimension"] == dimension]
    if not dim_events:
        return ""
    worst = min(dim_events, key=lambda e: e["score"])
    return worst.get("feedback", worst.get("action_description", ""))


def _generate_recommendations(dimension_scores: dict, improvements: list) -> list:
    recommendations = []
    for imp in improvements:
        dim_key = next(
            (k for k, v in DIMENSION_LABELS.items() if v == imp["dimension"]), None
        )
        if dim_key:
            recs = {
                "technical_knowledge": "Review policy language interpretation and coverage analysis fundamentals.",
                "investigation_quality": "Practice structured interviewing techniques and evidence analysis.",
                "communication": "Focus on empathy, clarity, and professional tone in all interactions.",
                "judgment_decision_making": "Study liability determination frameworks and valuation methods.",
                "process_adherence": "Review claims handling procedures and documentation requirements.",
                "fraud_awareness": "Study common fraud indicators and appropriate escalation procedures.",
            }
            recommendations.append(recs.get(dim_key, f"Continue developing {imp['dimension']} skills."))

    if not recommendations:
        recommendations.append("Continue practicing with higher difficulty tiers to refine your skills.")

    return recommendations
