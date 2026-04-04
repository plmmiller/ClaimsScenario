from __future__ import annotations

"""Tool definitions for the Anthropic API tool_use feature."""

TOOLS = [
    {
        "name": "set_active_persona",
        "description": (
            "Switch to a different persona before speaking as them. "
            "You MUST call this tool before speaking as any persona. "
            "Use persona_id 'system' for narration or phase transitions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "persona_id": {
                    "type": "string",
                    "description": "The ID of the persona to switch to (e.g., 'sarah-mitchell', 'james-torres', 'system')",
                },
                "context": {
                    "type": "string",
                    "description": "Brief reason for the persona switch",
                },
            },
            "required": ["persona_id"],
        },
    },
    {
        "name": "show_document",
        "description": (
            "Present an evidence document to the adjuster. Use this when the adjuster "
            "requests a document, or when the scenario requires presenting evidence. "
            "Documents include: police-report, policy-dec, medical-records, repair-estimate, "
            "witness-statement, dashcam-description."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "document_id": {
                    "type": "string",
                    "description": "ID of the document to show (e.g., 'police-report', 'policy-dec')",
                },
                "reason": {
                    "type": "string",
                    "description": "Why this document is being presented",
                },
            },
            "required": ["document_id", "reason"],
        },
    },
    {
        "name": "record_decision",
        "description": (
            "Record a significant decision made by the adjuster. Call this whenever "
            "the adjuster makes a coverage determination, liability assessment, "
            "settlement offer, or other key decision."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "decision_type": {
                    "type": "string",
                    "enum": [
                        "coverage_determination",
                        "liability_assessment",
                        "fault_percentage",
                        "damage_valuation",
                        "settlement_offer",
                        "reserve_amount",
                        "escalation",
                        "subrogation_decision",
                        "fraud_referral",
                        "documentation_action",
                    ],
                    "description": "The type of decision being recorded",
                },
                "value": {
                    "type": "string",
                    "description": "The decision value (e.g., '70/30 liability split', '$15,000 settlement offer')",
                },
                "rationale": {
                    "type": "string",
                    "description": "The adjuster's reasoning for this decision",
                },
                "phase": {
                    "type": "string",
                    "description": "The current claims phase",
                },
            },
            "required": ["decision_type", "value", "rationale", "phase"],
        },
    },
    {
        "name": "score_action",
        "description": (
            "Evaluate an adjuster action against the scoring rubric. Call this after "
            "the adjuster takes a significant action (asks a good question, misses "
            "something important, makes a correct determination, etc.). "
            "In learning mode, the score and feedback will be shown to the user. "
            "In assessment mode, it is recorded silently."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "dimension": {
                    "type": "string",
                    "enum": [
                        "technical_knowledge",
                        "investigation_quality",
                        "communication",
                        "judgment_decision_making",
                        "process_adherence",
                        "fraud_awareness",
                    ],
                    "description": "The competency dimension being scored",
                },
                "score": {
                    "type": "integer",
                    "enum": [1, 2, 3, 4],
                    "description": "Score: 1=needs_improvement, 2=developing, 3=proficient, 4=exemplary",
                },
                "action_description": {
                    "type": "string",
                    "description": "What the adjuster did that is being scored",
                },
                "rubric_criteria": {
                    "type": "string",
                    "description": "The specific rubric criteria this maps to",
                },
                "feedback": {
                    "type": "string",
                    "description": "Constructive feedback about the action",
                },
            },
            "required": ["dimension", "score", "action_description", "feedback"],
        },
    },
    {
        "name": "advance_phase",
        "description": (
            "Transition to the next claims lifecycle phase. Call this when the adjuster "
            "has substantially completed the current phase's objectives, or when they "
            "explicitly request to move on. Phases must follow this order: "
            "fnol -> coverage -> investigation -> liability -> damages -> negotiation -> resolution."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "from_phase": {
                    "type": "string",
                    "enum": ["fnol", "coverage", "investigation", "liability", "damages", "negotiation", "resolution"],
                    "description": "The phase being completed",
                },
                "to_phase": {
                    "type": "string",
                    "enum": ["fnol", "coverage", "investigation", "liability", "damages", "negotiation", "resolution"],
                    "description": "The phase being entered",
                },
                "completion_summary": {
                    "type": "string",
                    "description": "Summary of what was accomplished in the completed phase",
                },
                "missed_items": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Important items the adjuster missed in the completed phase",
                },
            },
            "required": ["from_phase", "to_phase", "completion_summary"],
        },
    },
    {
        "name": "provide_coaching",
        "description": (
            "Provide a coaching hint or explanation to the adjuster. ONLY available "
            "in learning mode (all phases) and hybrid mode (first 3 phases only). "
            "NEVER call this in assessment mode."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "coaching_type": {
                    "type": "string",
                    "enum": ["hint", "explanation", "correction", "best_practice", "phase_guidance"],
                    "description": "The type of coaching being provided",
                },
                "content": {
                    "type": "string",
                    "description": "The coaching content to display to the user",
                },
                "related_dimension": {
                    "type": "string",
                    "enum": [
                        "technical_knowledge",
                        "investigation_quality",
                        "communication",
                        "judgment_decision_making",
                        "process_adherence",
                        "fraud_awareness",
                    ],
                    "description": "Which competency dimension this coaching relates to",
                },
            },
            "required": ["coaching_type", "content"],
        },
    },
    {
        "name": "complete_simulation",
        "description": (
            "End the simulation session. Call this when the adjuster has completed "
            "the resolution phase, or when they explicitly request to end the session."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "enum": ["completed", "user_ended", "abandoned"],
                    "description": "Why the simulation is ending",
                },
                "final_summary": {
                    "type": "string",
                    "description": "Summary of the entire simulation session",
                },
            },
            "required": ["reason", "final_summary"],
        },
    },
]
