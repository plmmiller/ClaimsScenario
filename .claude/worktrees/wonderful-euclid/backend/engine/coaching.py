from __future__ import annotations

"""Coaching utilities for learning and hybrid modes."""

from engine.phase_manager import PHASE_LABELS, is_coaching_allowed


def get_phase_intro_coaching(phase: str, difficulty: str) -> str | None:
    """Return introductory coaching text when entering a new phase (guided/learning mode)."""
    intros = {
        # Claims scenario phases
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
        # Underwriting scenario phases
        "submission_review": (
            "You're beginning Submission Review. The agent, Karen Wells, has submitted a "
            "commercial property application for a retail electronics store. Review the "
            "ACORD application, check for completeness, and identify any initial red flags "
            "or missing information before proceeding with your assessment."
        ),
        "risk_assessment": (
            "Now assess the risk. Review the loss control inspection report, evaluate the "
            "building construction, occupancy, protection, and exposure (COPE factors). "
            "Consider the flat roof age, adjacent restaurant exposure, and overall condition. "
            "Identify hazards that need mitigation."
        ),
        "loss_history": (
            "Analyze the applicant's loss history. Review the 5-year loss runs from the "
            "prior carrier. Look at frequency, severity, and trends. The prior water damage "
            "claim is particularly relevant — understand the cause and what remediation was done."
        ),
        "pricing": (
            "Develop your premium. Apply the base rate, then consider schedule credits and "
            "debits for building condition, protection class, loss history, and risk quality. "
            "Compare against market rates and ensure profitability while remaining competitive."
        ),
        "terms_conditions": (
            "Determine the coverage terms. Decide on the policy form (BPP, BOP, or package), "
            "set sublimits for specific perils, determine deductibles, and identify any "
            "exclusions or endorsements needed. Consider water damage sublimits given the history."
        ),
        "binding": (
            "Finalize the account. Issue the binder with all agreed terms, confirm with the "
            "agent, ensure all documentation is complete, set up the policy in the system, "
            "and establish any post-bind requirements (e.g., roof inspection timeline)."
        ),
        # Marketing scenario phases
        "market_research": (
            "You're starting Market Research for the SmartDrive product launch in Colorado. "
            "Analyze the competitive landscape, understand the target demographic (safe drivers "
            "aged 25-45), review market data, and identify opportunities and threats in the "
            "Colorado auto insurance market."
        ),
        "strategy_development": (
            "Develop your marketing strategy. Define your value proposition, key messaging, "
            "and positioning against competitors. Choose your marketing channels, set KPIs, "
            "and create a timeline. Consider both direct-to-consumer and agency channels."
        ),
        "content_creation": (
            "Create your campaign materials. Develop ad copy for digital channels, design "
            "landing page content, create agent sales kits, draft email sequences, and plan "
            "social media content. Ensure everything aligns with brand guidelines."
        ),
        "agency_enablement": (
            "Equip your agency partners. Create training materials, commission schedules, "
            "competitive comparison sheets, and objection-handling guides. Present the product "
            "to agents and address their concerns about telematics and pricing."
        ),
        "campaign_launch": (
            "Execute the launch. Coordinate across digital, email, social, and agency channels. "
            "Set up tracking, ensure all landing pages and forms work, brief the agency force, "
            "and monitor the initial response. Be ready to make quick adjustments."
        ),
        "performance_tracking": (
            "Monitor campaign performance. Track key metrics: impressions, CTR, cost per lead, "
            "quote starts, bind rate, and CAC. Analyze which channels perform best, identify "
            "underperformers, and optimize spend allocation."
        ),
        "reporting": (
            "Compile your campaign report. Calculate overall ROI, summarize performance by "
            "channel, document key learnings, and prepare recommendations for the next phase. "
            "Present results to leadership with actionable insights."
        ),
    }
    return intros.get(phase)
