"use client";

import {
  BookOpen,
  GraduationCap,
  Layers,
  BarChart3,
  Target,
  Lightbulb,
  Car,
  ClipboardCheck,
  Megaphone,
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Shield,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Help</h1>
      <p className="text-gray-500 mb-8">
        Everything you need to know about using the Claims Simulation Platform
      </p>

      <div className="space-y-6">
        {/* Getting Started */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              The Claims Simulation Platform is an AI-powered training tool that immerses you in
              realistic insurance claims scenarios. You play the role of a claims adjuster and
              interact with simulated claimants, witnesses, medical providers, and other parties
              to resolve claims from start to finish.
            </p>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to start your first simulation:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>Navigate to the <span className="font-medium">Scenarios</span> page from the sidebar</li>
                <li>Select a scenario from the available options</li>
                <li>Choose your simulation mode, experience level, and difficulty</li>
                <li>Click <span className="font-medium">Start Simulation</span> to begin</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Understanding the dashboard:</p>
              <p>
                Your dashboard shows all past and active simulation sessions. Click an active
                session to resume it, or click a completed session to view your performance report.
              </p>
            </div>
          </div>
        </section>

        {/* Simulation Modes */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Simulation Modes</h2>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Learning Mode</p>
              <p className="text-sm text-gray-600">
                Real-time coaching, hints, and feedback throughout the simulation. When you make
                mistakes, the system explains what you should have done. Ideal for building
                foundational skills and understanding the claims process.
              </p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Assessment Mode</p>
              <p className="text-sm text-gray-600">
                Silent scoring with no hints or coaching. The simulation behaves like a real-world
                scenario — you must navigate it independently. Scores are recorded in the background
                and revealed in your final performance report. Tests true readiness.
              </p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Hybrid Mode</p>
              <p className="text-sm text-gray-600">
                Coaching is available in the early phases (FNOL, Coverage, Investigation), then
                transitions to assessment mode for the later phases (Liability, Damages,
                Negotiation, Resolution). A balanced approach that supports learning while
                still testing independent decision-making.
              </p>
            </div>
          </div>
        </section>

        {/* Experience Levels */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Experience Levels</h2>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Beginner</p>
              <p className="text-sm text-gray-600">
                Simpler language with insurance terms explained as they come up. Interactions are
                patient and provide extra context and background. Ideal for those new to insurance
                or claims adjusting.
              </p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Intermediate</p>
              <p className="text-sm text-gray-600">
                Standard industry language with only complex or uncommon terms explained. Moderate
                pacing that assumes familiarity with basic insurance concepts and terminology.
              </p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Experienced</p>
              <p className="text-sm text-gray-600">
                Full industry jargon and technical terminology used throughout. Fast pace with
                challenging interactions. Personas may push back on unnecessary questions and
                expect efficient handling. Best for seasoned professionals.
              </p>
            </div>
          </div>
        </section>

        {/* Difficulty Tiers */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Layers className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Difficulty Tiers</h2>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Guided</p>
              <p className="text-sm text-gray-600">
                Cooperative personas, clear evidence, and phase transition hints. The scenario is
                simplified to help you focus on learning the process without unnecessary complexity.
              </p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Standard</p>
              <p className="text-sm text-gray-600">
                Realistic complexity with some ambiguity in evidence and witness statements.
                Personas behave naturally and may withhold information unless asked directly.
                Represents a typical real-world claim.
              </p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">Advanced</p>
              <p className="text-sm text-gray-600">
                Uncooperative parties, ambiguous evidence, and unexpected complications such as
                fraud indicators, coverage disputes, and attorney involvement. Requires strong
                critical thinking and professional judgment.
              </p>
            </div>
          </div>
        </section>

        {/* Scenario Types */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Scenario Types</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 border border-gray-100 rounded-lg p-4">
              <Car className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Auto Claims</p>
                <p className="text-sm text-gray-600">
                  Investigate and resolve auto insurance claims. Interview claimants and witnesses,
                  review police reports, assess vehicle damage, determine liability, and negotiate
                  settlements.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-gray-100 rounded-lg p-4">
              <ClipboardCheck className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Underwriting</p>
                <p className="text-sm text-gray-600">
                  Assess risk and price commercial property policies. Evaluate applications,
                  review inspection reports, analyze loss history, and make coverage decisions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-gray-100 rounded-lg p-4">
              <Megaphone className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Marketing</p>
                <p className="text-sm text-gray-600">
                  Plan and execute insurance product marketing campaigns. Develop target audience
                  strategies, create messaging, manage budgets, and measure campaign effectiveness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Claims Lifecycle */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <ArrowRight className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Claims Lifecycle (7 Phases)</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                phase: "1. First Notice of Loss (FNOL)",
                desc: "Receive the initial claim report, gather preliminary information from the claimant, and set up the claim file.",
              },
              {
                phase: "2. Coverage Verification",
                desc: "Review the policy to confirm coverage applies, identify any exclusions or limitations, and verify policy status.",
              },
              {
                phase: "3. Investigation",
                desc: "Interview all parties, collect statements, review evidence such as police reports and photos, and establish the facts.",
              },
              {
                phase: "4. Liability Determination",
                desc: "Analyze the evidence to determine fault percentages, apply comparative negligence rules, and document your liability decision.",
              },
              {
                phase: "5. Damage Assessment",
                desc: "Evaluate property damage estimates, review medical records and bills, and determine the total value of the claim.",
              },
              {
                phase: "6. Negotiation & Settlement",
                desc: "Present settlement offers, negotiate with claimants or attorneys, handle counteroffers, and reach a fair resolution.",
              },
              {
                phase: "7. Resolution & Closing",
                desc: "Finalize the settlement, process payments, complete all documentation, and close the claim file.",
              },
            ].map((item) => (
              <div key={item.phase} className="border border-gray-100 rounded-lg p-4">
                <p className="font-medium text-gray-900 text-sm mb-1">{item.phase}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring & Reports */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Scoring & Reports</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-700 mb-2">6 Scoring Dimensions:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Technical Knowledge", weight: "20%" },
                  { name: "Investigation Quality", weight: "20%" },
                  { name: "Communication Skills", weight: "15%" },
                  { name: "Decision Making", weight: "20%" },
                  { name: "Process Adherence", weight: "15%" },
                  { name: "Professional Judgment", weight: "10%" },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                    <span>{d.name}</span>
                    <span className="text-gray-400 font-medium">{d.weight}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-2">Performance Levels:</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Exemplary (90-100)</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Proficient (75-89)</span>
                <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">Developing (60-74)</span>
                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">Needs Improvement (&lt;60)</span>
              </div>
            </div>
            <p>
              After completing a simulation, your performance report breaks down scores by dimension,
              highlights strengths and areas for improvement, and provides actionable recommendations
              for growth.
            </p>
          </div>
        </section>

        {/* Tips for Success */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Tips for Success</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: Star,
                tip: "Use open-ended questions",
                detail: "Ask 'what happened?' instead of 'did you run the red light?' to get more complete information.",
              },
              {
                icon: ClipboardCheck,
                tip: "Document decisions with rationale",
                detail: "Always explain why you made a decision, not just what you decided. This demonstrates professional judgment.",
              },
              {
                icon: Shield,
                tip: "Review all available evidence",
                detail: "Request and examine every document available in each phase. Missing evidence leads to incomplete analysis.",
              },
              {
                icon: TrendingUp,
                tip: "Stay in character as the adjuster",
                detail: "Treat every interaction as if it were a real claim. Professional demeanor and thoroughness are scored.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.tip} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-emerald-500" />
                    <p className="font-medium text-gray-900 text-sm">{item.tip}</p>
                  </div>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
