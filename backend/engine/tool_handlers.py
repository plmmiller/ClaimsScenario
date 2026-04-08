from __future__ import annotations

"""Executes tool calls from the AI and returns results."""

from datetime import datetime, timezone
from uuid import uuid4

from engine import scenario_loader
from engine.phase_manager import validate_transition, update_phase_history, is_coaching_allowed
from engine.scorer import create_scoring_event
from db import queries


class ToolHandlers:
    def __init__(self, session: dict, scenario: dict):
        self.session = session
        self.scenario = scenario
        # Accumulate state changes to persist after the full turn
        self.state_updates: dict = {}
        self.new_scoring_events: list[dict] = []
        self.new_decisions: list[dict] = []
        self.sse_events: list[dict] = []  # Events to send to frontend

    def handle(self, tool_name: str, tool_input: dict) -> dict:
        handler = getattr(self, f"_handle_{tool_name}", None)
        if not handler:
            return {"error": f"Unknown tool: {tool_name}"}
        return handler(tool_input)

    def _handle_set_active_persona(self, input: dict) -> dict:
        persona_id = input["persona_id"]
        if persona_id == "system":
            self.sse_events.append({
                "event": "persona",
                "data": {"persona_id": "system", "name": "System", "role": "narrator"},
            })
            return {"status": "ok", "active_persona": "system"}

        persona = self.scenario.get("personas", {}).get(persona_id)
        if not persona:
            return {"error": f"Unknown persona: {persona_id}"}

        self.sse_events.append({
            "event": "persona",
            "data": {"persona_id": persona_id, "name": persona["name"], "role": persona["role"]},
        })
        return {"status": "ok", "active_persona": persona["name"]}

    def _handle_show_document(self, input: dict) -> dict:
        doc_id = input["document_id"]
        content = scenario_loader.get_evidence(self.session["scenario_id"], doc_id)

        if not content:
            return {"error": f"Document not found: {doc_id}"}

        # Track document access
        docs_accessed = self.session.get("documents_accessed", [])
        if doc_id not in docs_accessed:
            docs_accessed.append(doc_id)
            self.state_updates["documents_accessed"] = docs_accessed

        self.sse_events.append({
            "event": "tool_result",
            "data": {"tool": "show_document", "document_id": doc_id, "content": content},
        })

        return {"status": "ok", "document_id": doc_id, "content": content}

    def _handle_record_decision(self, input: dict) -> dict:
        decision = {
            "id": str(uuid4()),
            "phase": input.get("phase", self.session["current_phase"]),
            "decision_type": input["decision_type"],
            "value": input["value"],
            "rationale": input["rationale"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self.new_decisions.append(decision)
        self.sse_events.append({
            "event": "tool_call",
            "data": {"tool": "record_decision", "input": input},
        })

        return {"status": "ok", "decision_id": decision["id"]}

    def _handle_score_action(self, input: dict) -> dict:
        event = create_scoring_event(
            dimension=input["dimension"],
            score=input["score"],
            action_description=input["action_description"],
            feedback=input["feedback"],
            phase=self.session["current_phase"],
            rubric_criteria=input.get("rubric_criteria"),
            what_was_expected=input.get("what_was_expected"),
            evidence=input.get("evidence"),
            improvement_tip=input.get("improvement_tip"),
        )
        self.new_scoring_events.append(event)

        mode = self.session["mode"]
        show_to_user = mode == "learning" or (
            mode == "hybrid" and is_coaching_allowed("hybrid", self.session["current_phase"])
        )

        if show_to_user:
            self.sse_events.append({
                "event": "score_event",
                "data": {
                    "dimension": input["dimension"],
                    "score": input["score"],
                    "feedback": input["feedback"],
                    "action_description": input["action_description"],
                    "what_was_expected": input.get("what_was_expected", ""),
                    "evidence": input.get("evidence", []),
                    "improvement_tip": input.get("improvement_tip", ""),
                },
            })

        return {"status": "ok", "recorded": True, "visible_to_user": show_to_user}

    def _handle_advance_phase(self, input: dict) -> dict:
        from_phase = input["from_phase"]
        to_phase = input["to_phase"]

        if not validate_transition(from_phase, to_phase):
            return {"error": f"Invalid phase transition: {from_phase} -> {to_phase}"}

        if from_phase != self.session["current_phase"]:
            return {"error": f"Current phase is {self.session['current_phase']}, not {from_phase}"}

        # Update phase history
        phase_history = self.session.get("phase_history", [])
        updated_history = update_phase_history(
            phase_history, from_phase, to_phase, input["completion_summary"]
        )

        self.state_updates["current_phase"] = to_phase
        self.state_updates["phase_history"] = updated_history

        # Score missed items as process adherence deductions
        missed = input.get("missed_items", [])
        if missed:
            for item in missed:
                event = create_scoring_event(
                    dimension="process_adherence",
                    score=1,
                    action_description=f"Missed during {from_phase}: {item}",
                    feedback=f"The adjuster did not address: {item}",
                    phase=from_phase,
                )
                self.new_scoring_events.append(event)

        self.sse_events.append({
            "event": "phase_change",
            "data": {
                "from": from_phase,
                "to": to_phase,
                "summary": input["completion_summary"],
            },
        })

        return {
            "status": "ok",
            "new_phase": to_phase,
            "missed_items_scored": len(missed),
        }

    def _handle_provide_coaching(self, input: dict) -> dict:
        mode = self.session["mode"]
        current_phase = self.session["current_phase"]

        if not is_coaching_allowed(mode, current_phase):
            return {"error": "Coaching is not available in the current mode/phase"}

        self.sse_events.append({
            "event": "coaching",
            "data": {
                "type": input["coaching_type"],
                "hint": input["content"],
                "dimension": input.get("related_dimension"),
            },
        })

        return {"status": "ok"}

    def _handle_complete_simulation(self, input: dict) -> dict:
        self.state_updates["status"] = "completed"
        self.state_updates["completed_at"] = datetime.now(timezone.utc).isoformat()

        self.sse_events.append({
            "event": "simulation_complete",
            "data": {
                "reason": input["reason"],
                "summary": input["final_summary"],
            },
        })

        return {"status": "ok", "session_completed": True}

    def persist_state(self):
        """Persist accumulated state changes to the database."""
        session_id = self.session["id"]

        # Merge new decisions
        if self.new_decisions:
            existing = self.session.get("decisions", [])
            self.state_updates["decisions"] = existing + self.new_decisions

        # Merge new scoring events
        if self.new_scoring_events:
            existing = self.session.get("scoring_events", [])
            self.state_updates["scoring_events"] = existing + self.new_scoring_events

        if self.state_updates:
            queries.update_session(session_id, self.state_updates)

            # Update local session state for continued use in this turn
            for key, val in self.state_updates.items():
                self.session[key] = val
