"use client";

import { useState } from "react";
import { HelpCircle, X, ChevronDown, ChevronRight, Lightbulb, Target, BookOpen } from "lucide-react";

// ── Phase-specific help for all three scenario types ──

const PHASE_HELP: Record<string, { title: string; goal: string; tips: string[]; avoid: string[] }> = {
  // Claims
  fnol: {
    title: "First Notice of Loss",
    goal: "Gather the initial claim details: who, what, when, where, and how. Establish the claimant's account and open the file.",
    tips: [
      "Use open-ended questions: 'Tell me what happened' instead of leading questions",
      "Capture date, time, location, weather, and parties involved",
      "Ask about injuries and vehicle damage early",
      "Document the claimant's statement in their own words",
      "Get contact information for all parties and witnesses",
    ],
    avoid: [
      "Don't make liability judgments during FNOL",
      "Don't promise coverage or outcomes",
      "Don't skip asking about injuries — even minor ones matter",
    ],
  },
  coverage: {
    title: "Coverage Verification",
    goal: "Confirm the policy is active and covers this type of loss. Identify any exclusions, limitations, or endorsements that apply.",
    tips: [
      "Verify policy effective dates against the incident date",
      "Check named insureds and listed vehicles",
      "Review all applicable coverage types (liability, collision, comprehensive, UM/UIM)",
      "Note deductibles, coverage limits, and any endorsements",
      "Look for potential coverage issues (lapsed policy, excluded driver, business use)",
    ],
    avoid: [
      "Don't skip this step — coverage issues found later cause major problems",
      "Don't assume coverage applies without verifying the policy",
      "Don't overlook subrogation opportunities",
    ],
  },
  investigation: {
    title: "Investigation",
    goal: "Collect all evidence, interview all parties and witnesses, and establish the facts of the loss.",
    tips: [
      "Interview each party separately — compare their accounts for consistency",
      "Request the police report and review it carefully",
      "Ask witnesses what they saw, not what they think happened",
      "Request photos of vehicle damage, the scene, and injuries",
      "Look for discrepancies between statements and physical evidence",
    ],
    avoid: [
      "Don't rely on a single source of information",
      "Don't share one party's statement with another during interviews",
      "Don't ignore red flags that may indicate fraud",
    ],
  },
  liability: {
    title: "Liability Determination",
    goal: "Analyze all evidence to determine fault percentages. Apply the applicable negligence standard (comparative, contributory, etc.).",
    tips: [
      "Consider traffic laws and right-of-way rules",
      "Weigh physical evidence against party statements",
      "Apply the jurisdiction's negligence standard (e.g., California pure comparative)",
      "Document your liability analysis with specific evidence citations",
      "Consider multiple theories of negligence",
    ],
    avoid: [
      "Don't assign liability without supporting evidence",
      "Don't ignore contributory negligence of the insured",
      "Don't make a determination based only on statements — use physical evidence too",
    ],
  },
  damages: {
    title: "Damage Assessment & Valuation",
    goal: "Determine the total value of the claim: vehicle repairs, medical expenses, lost wages, pain and suffering.",
    tips: [
      "Get at least one independent repair estimate",
      "Review medical records for treatment necessity and causation",
      "Calculate special damages (medical bills, lost wages) separately from general damages",
      "Consider future medical treatment if injuries are ongoing",
      "Use comparable settlements for general damage valuation",
    ],
    avoid: [
      "Don't accept inflated repair estimates without review",
      "Don't overlook pre-existing conditions vs. accident-related injuries",
      "Don't value the claim without all medical records",
    ],
  },
  negotiation: {
    title: "Negotiation & Settlement",
    goal: "Present a fair offer based on your evaluation and negotiate toward a reasonable settlement.",
    tips: [
      "Prepare your settlement range before starting negotiations",
      "Explain the basis for your offer clearly",
      "Be professional but firm — justify each component of your valuation",
      "Document all offers and counteroffers",
      "Know your authority limits and when to escalate",
    ],
    avoid: [
      "Don't open with your best offer — leave room to negotiate",
      "Don't get emotional or adversarial",
      "Don't accept a demand without analysis just to close the claim",
    ],
  },
  resolution: {
    title: "Resolution & Closing",
    goal: "Finalize the settlement, process payments, complete documentation, and close the file.",
    tips: [
      "Get a signed release before issuing payment",
      "Verify all subrogation rights are preserved",
      "Complete all required documentation and file notes",
      "Ensure payment is issued to the correct party",
      "Review the entire file for completeness before closing",
    ],
    avoid: [
      "Don't close without a signed release",
      "Don't leave open items or incomplete documentation",
    ],
  },

  // Underwriting
  submission_review: {
    title: "Submission Review",
    goal: "Review the application for completeness, identify the risk type, and determine if it falls within your appetite.",
    tips: [
      "Check all required application fields are complete",
      "Identify the occupancy type and construction class",
      "Note any unusual exposures or red flags",
      "Verify the requested coverage amount is appropriate",
      "Ask the agent for missing information before proceeding",
    ],
    avoid: [
      "Don't proceed with an incomplete submission",
      "Don't overlook the occupancy or adjacent exposures",
    ],
  },
  risk_assessment: {
    title: "Risk Assessment",
    goal: "Evaluate the physical risk, protection systems, management quality, and external exposures.",
    tips: [
      "Assess building age, construction, and roof condition",
      "Review fire protection (sprinklers, alarms, fire dept distance)",
      "Consider adjacent exposures (restaurants, chemical plants, etc.)",
      "Evaluate the business owner's risk management practices",
      "Order a loss control inspection if warranted",
    ],
    avoid: [
      "Don't ignore adjacent exposure risks",
      "Don't assume newer buildings are automatically lower risk",
    ],
  },
  loss_history: {
    title: "Loss History Analysis",
    goal: "Review claims history, identify patterns, and assess whether losses indicate ongoing risk.",
    tips: [
      "Look at loss frequency and severity trends over 3-5 years",
      "Distinguish between attritional and catastrophic losses",
      "Ask about corrective actions taken after prior claims",
      "Consider industry benchmarks for loss ratios",
      "Check if prior carriers non-renewed and why",
    ],
    avoid: [
      "Don't ignore even small prior claims — patterns matter",
      "Don't penalize a single weather-related loss the same as negligence",
    ],
  },
  pricing: {
    title: "Pricing & Rating",
    goal: "Develop a premium that reflects the risk using base rates, schedule modifications, and experience rating.",
    tips: [
      "Start with the base rate for the class and territory",
      "Apply schedule credits/debits for risk-specific factors",
      "Use experience modification if sufficient premium volume exists",
      "Compare your price to market benchmarks",
      "Ensure the price supports the expected loss ratio",
    ],
    avoid: [
      "Don't price below the minimum technical rate",
      "Don't let competitive pressure override sound underwriting",
    ],
  },
  terms_conditions: {
    title: "Terms & Conditions",
    goal: "Determine appropriate policy terms, endorsements, deductibles, and any special conditions.",
    tips: [
      "Select a deductible appropriate for the risk",
      "Add relevant endorsements (ordinance or law, equipment breakdown, etc.)",
      "Consider coinsurance requirements",
      "Document any special conditions or warranties",
      "Review sub-limits for specific perils",
    ],
    avoid: [
      "Don't offer broad terms on a marginal risk without compensating in price",
      "Don't forget to address known exposures with specific endorsements",
    ],
  },
  binding: {
    title: "Binding & Issuance",
    goal: "Make the final accept/decline/modify decision and issue the policy if accepted.",
    tips: [
      "Summarize your full underwriting analysis before deciding",
      "Document your rationale for the decision clearly",
      "If declining, explain the reasons professionally to the agent",
      "If binding with conditions, ensure all conditions are clearly stated",
      "Verify all pricing and terms are accurate before issuance",
    ],
    avoid: [
      "Don't bind a risk you aren't comfortable with",
      "Don't leave the agent without a clear answer and next steps",
    ],
  },

  // Marketing
  market_research: {
    title: "Market Research",
    goal: "Understand the target market, competitive landscape, and consumer needs to inform your strategy.",
    tips: [
      "Define your target demographic with specifics (age, income, behavior)",
      "Analyze 2-3 key competitors' positioning and messaging",
      "Identify unmet needs or pain points in the market",
      "Review regulatory requirements for marketing in the target state",
      "Use data to support your findings, not assumptions",
    ],
    avoid: [
      "Don't skip competitive analysis",
      "Don't assume your target market without data",
    ],
  },
  strategy_development: {
    title: "Strategy Development",
    goal: "Create positioning, messaging pillars, and a channel strategy aligned with your research findings.",
    tips: [
      "Develop a clear value proposition that differentiates from competitors",
      "Create 2-3 messaging pillars tied to consumer pain points",
      "Select channels that reach your specific target audience",
      "Allocate budget across channels based on expected ROI",
      "Set measurable KPIs for each channel",
    ],
    avoid: [
      "Don't try to be everything to everyone — focus your positioning",
      "Don't allocate budget without justifying channel selections",
    ],
  },
  content_creation: {
    title: "Content Creation",
    goal: "Develop campaign creative — ads, landing pages, email sequences, social content — that executes your strategy.",
    tips: [
      "Ensure all creative aligns with your messaging pillars",
      "Tailor content for each channel's format and audience expectations",
      "Include clear calls to action in every piece",
      "Have content reviewed for regulatory compliance",
      "Test multiple variations for digital channels (A/B testing)",
    ],
    avoid: [
      "Don't use the same copy across all channels — adapt it",
      "Don't forget compliance review for insurance marketing materials",
    ],
  },
  agency_enablement: {
    title: "Agency Enablement",
    goal: "Equip agency partners with the tools, training, and materials they need to sell the product effectively.",
    tips: [
      "Create a product one-pager with key selling points and differentiators",
      "Develop FAQ documents addressing common agent questions",
      "Provide competitive comparison sheets",
      "Plan training sessions or webinars for agents",
      "Set up a feedback channel for agent questions during launch",
    ],
    avoid: [
      "Don't assume agents will read lengthy documents — keep materials concise",
      "Don't launch without agent buy-in and readiness confirmation",
    ],
  },
  campaign_launch: {
    title: "Campaign Launch",
    goal: "Execute the campaign across all channels, monitor initial performance, and respond to early signals.",
    tips: [
      "Verify all tracking pixels and analytics are in place before launch",
      "Monitor performance hourly in the first 24-48 hours",
      "Have a rapid response plan for underperforming channels",
      "Coordinate timing across channels for maximum impact",
      "Ensure customer service is briefed and ready for inquiries",
    ],
    avoid: [
      "Don't launch without verified tracking — you won't know what's working",
      "Don't set it and forget it — active monitoring is essential at launch",
    ],
  },
  performance_tracking: {
    title: "Performance Tracking",
    goal: "Measure campaign performance against KPIs, optimize underperforming channels, and scale what's working.",
    tips: [
      "Track key metrics daily: impressions, clicks, conversions, cost per acquisition",
      "Compare actual performance against your KPI targets",
      "Shift budget from underperforming to high-performing channels",
      "Test new creative or messaging based on what's resonating",
      "Document insights for the final report",
    ],
    avoid: [
      "Don't make big changes based on a single day's data — look for trends",
      "Don't ignore vanity metrics vs. actual conversion data",
    ],
  },
  reporting: {
    title: "Reporting & ROI",
    goal: "Compile final results, calculate ROI, and present actionable recommendations to leadership.",
    tips: [
      "Lead with business outcomes: policies sold, revenue generated, ROI",
      "Compare results to original KPIs and budget",
      "Include channel-by-channel performance breakdown",
      "Highlight what worked and what didn't with specific data",
      "Provide 3-5 actionable recommendations for the next campaign",
    ],
    avoid: [
      "Don't bury poor results — address them with learnings",
      "Don't present data without context and recommendations",
    ],
  },
};

// ── Mode-specific tips ──

const MODE_HELP: Record<string, { label: string; tips: string[] }> = {
  learning: {
    label: "Learning Mode",
    tips: [
      "You'll receive coaching hints and score feedback in real-time",
      "Don't worry about making mistakes — they're learning opportunities",
      "Pay attention to the coaching messages for guidance on what to do next",
      "Check the Progress panel often to track your tasks and scores",
    ],
  },
  assessment: {
    label: "Assessment Mode",
    tips: [
      "No hints or coaching will be provided — you're on your own",
      "Scores are recorded silently and shown in your final report",
      "Approach this like a real scenario — be thorough and professional",
      "Use the Score button to check your running score (assessment only shows totals)",
    ],
  },
  hybrid: {
    label: "Hybrid Mode",
    tips: [
      "Coaching is available in the first 3 phases, then switches to assessment",
      "Use the early phases to build your approach and confidence",
      "When coaching stops, you'll be notified — rely on what you learned",
      "Later phases test whether you can apply skills independently",
    ],
  },
};

// ── Page-level help ──

const PAGE_HELP: Record<string, { title: string; description: string; tips: string[] }> = {
  dashboard: {
    title: "Your Dashboard",
    description: "View and manage your simulation sessions. Active sessions can be resumed; completed sessions have performance reports.",
    tips: [
      "Click an active session card to resume where you left off",
      "Click a completed session to view your detailed performance report",
      "Use the delete button (trash icon) to remove sessions you no longer need",
      "Start a new simulation from the Scenarios page in the sidebar",
    ],
  },
  scenarios: {
    title: "Choose a Scenario",
    description: "Select a scenario, then configure your simulation mode, experience level, and difficulty before starting.",
    tips: [
      "New to the platform? Start with Learning mode, Beginner level, Guided difficulty",
      "Learning mode gives real-time feedback; Assessment mode tests you silently",
      "Difficulty controls how cooperative the personas are and how complex the scenario gets",
      "Experience level adjusts the language and pacing to match your background",
    ],
  },
  report: {
    title: "Performance Report",
    description: "Your detailed performance breakdown showing scores across all dimensions, strengths, areas for improvement, and recommendations.",
    tips: [
      "Review your dimension scores to identify specific areas to work on",
      "Read the phase narratives to understand how you performed at each stage",
      "Use the recommendations to guide your next simulation",
      "Compare reports across sessions to track your progress over time",
    ],
  },
  admin: {
    title: "Admin Dashboard",
    description: "View platform analytics, user activity, and session data across all learners.",
    tips: [
      "Monitor completion rates and average scores to track program effectiveness",
      "Click on individual users to see their session history",
      "Use session transcripts to review specific learner interactions",
    ],
  },
};

// ── The Component ──

interface ContextHelpProps {
  page: "dashboard" | "scenarios" | "session" | "report" | "admin";
  phase?: string;
  mode?: string;
  scenarioId?: string;
  difficulty?: string;
}

export default function ContextHelp({ page, phase, mode, scenarioId, difficulty }: ContextHelpProps) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["phase"]));

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const pageHelp = PAGE_HELP[page];
  const phaseHelp = phase ? PHASE_HELP[phase] : null;
  const modeHelp = mode ? MODE_HELP[mode] : null;

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          open
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title="Context-sensitive help"
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </button>

      {/* Help drawer */}
      {open && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                {page === "session" && phaseHelp ? phaseHelp.title : pageHelp?.title || "Help"}
              </h3>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Page-level help (non-session pages) */}
            {page !== "session" && pageHelp && (
              <div>
                <p className="text-sm text-gray-600 mb-3">{pageHelp.description}</p>
                <div className="space-y-2">
                  {pageHelp.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session: Phase-specific help */}
            {page === "session" && phaseHelp && (
              <div>
                <button
                  onClick={() => toggleSection("phase")}
                  className="flex items-center gap-2 w-full text-left mb-2"
                >
                  {expandedSections.has("phase") ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Phase Goal: {phaseHelp.title}
                  </span>
                </button>

                {expandedSections.has("phase") && (
                  <div className="ml-6 space-y-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{phaseHelp.goal}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                        What to do
                      </p>
                      <div className="space-y-1.5">
                        {phaseHelp.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span className="text-gray-700">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                        What to avoid
                      </p>
                      <div className="space-y-1.5">
                        {phaseHelp.avoid.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-red-500 shrink-0">✗</span>
                            <span className="text-gray-700">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Session: Mode tips */}
            {page === "session" && modeHelp && (
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => toggleSection("mode")}
                  className="flex items-center gap-2 w-full text-left mb-2"
                >
                  {expandedSections.has("mode") ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {modeHelp.label} Tips
                  </span>
                </button>

                {expandedSections.has("mode") && (
                  <div className="ml-6 space-y-1.5">
                    {modeHelp.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Session: Scoring reminder */}
            {page === "session" && (
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => toggleSection("scoring")}
                  className="flex items-center gap-2 w-full text-left mb-2"
                >
                  {expandedSections.has("scoring") ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    How You&apos;re Scored
                  </span>
                </button>

                {expandedSections.has("scoring") && (
                  <div className="ml-6 space-y-2 text-sm text-gray-700">
                    <p>Your actions are evaluated across 6 competency dimensions:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { name: "Technical Knowledge", weight: "25%" },
                        { name: "Investigation Quality", weight: "20%" },
                        { name: "Communication", weight: "20%" },
                        { name: "Judgment & Decision-Making", weight: "20%" },
                        { name: "Process Adherence", weight: "10%" },
                        { name: "Fraud/Risk Awareness", weight: "5%" },
                      ].map((d) => (
                        <div key={d.name} className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                          <span>{d.name}</span>
                          <span className="text-gray-400 font-medium">{d.weight}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Each scored action is rated 1-4. Click the{" "}
                      {mode === "assessment" ? "Score" : "Progress"} button to see your running scores
                      and click any dimension to see detailed explanations.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
