export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "learner" | "instructor" | "admin";
  organization?: string;
  created_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  scenario_id: string;
  mode: "learning" | "assessment" | "hybrid";
  difficulty: "guided" | "standard" | "advanced";
  current_phase: Phase;
  status: "active" | "paused" | "completed" | "abandoned";
  phase_history: PhaseEntry[];
  decisions: Decision[];
  documents_accessed: string[];
  scoring_events: ScoringEvent[];
  metadata: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
}

export type Phase =
  | "fnol"
  | "coverage"
  | "investigation"
  | "liability"
  | "damages"
  | "negotiation"
  | "resolution";

export const PHASE_LABELS: Record<Phase, string> = {
  fnol: "First Notice of Loss",
  coverage: "Coverage Verification",
  investigation: "Investigation",
  liability: "Liability Determination",
  damages: "Damage Assessment",
  negotiation: "Negotiation & Settlement",
  resolution: "Resolution & Closing",
};

export const PHASE_ORDER: Phase[] = [
  "fnol",
  "coverage",
  "investigation",
  "liability",
  "damages",
  "negotiation",
  "resolution",
];

export interface PhaseEntry {
  phase: Phase;
  entered_at: string;
  exited_at?: string;
  completion_summary?: string;
}

export interface Decision {
  id: string;
  phase: Phase;
  decision_type: string;
  value: string;
  rationale: string;
  timestamp: string;
}

export interface ScoringEvent {
  dimension: string;
  score: number;
  max_score: number;
  action_description: string;
  feedback: string;
  phase: Phase;
  timestamp: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  persona?: string;
  content: string;
  phase: Phase;
  created_at: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty_range: string[];
  estimated_duration: Record<string, number>;
  phases: string[];
  personas?: { id: string; name: string; role: string }[];
}

export interface Report {
  id: string;
  session_id: string;
  overall_score: number;
  overall_level: string;
  dimension_scores: Record<
    string,
    {
      label: string;
      average_score: number;
      count: number;
      weight: number;
      weighted_score: number;
      level: string;
    }
  >;
  phase_narratives: Record<string, string>;
  strengths: { dimension: string; score: number; detail: string }[];
  improvements: { dimension: string; score: number; detail: string }[];
  recommendations: string[];
}

export interface PersonaInfo {
  persona_id: string;
  name: string;
  role: string;
}

// Persona avatar colors (matching the YAML definitions)
export const PERSONA_COLORS: Record<string, string> = {
  "sarah-mitchell": "#4A90D9",
  "james-torres": "#E74C3C",
  "linda-park": "#27AE60",
  "mikes-auto-body": "#F39C12",
  "dr-patel": "#9B59B6",
  "attorney-davis": "#2C3E50",
  system: "#6B7280",
};
