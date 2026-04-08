"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReport, generateReport } from "@/lib/api";
import { Report } from "@/types";
import {
  Award,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Target,
} from "lucide-react";
import ContextHelp from "@/components/ContextHelp";

const LEVEL_COLORS = {
  exemplary: "text-green-700 bg-green-50 border-green-200",
  proficient: "text-blue-700 bg-blue-50 border-blue-200",
  developing: "text-yellow-700 bg-yellow-50 border-yellow-200",
  needs_improvement: "text-red-700 bg-red-50 border-red-200",
  not_assessed: "text-gray-500 bg-gray-50 border-gray-200",
};

const SCORE_COLORS = [
  "bg-red-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
];

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getReport(sessionId)
      .then(setReport)
      .catch(() => {
        // Report doesn't exist yet — try generating
        setGenerating(true);
        generateReport(sessionId)
          .then(setReport)
          .catch((err) => setError(err.message))
          .finally(() => setGenerating(false));
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500">
          {generating ? "Generating your report..." : "Loading report..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-blue-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  if (!report) return null;

  const levelLabel = report.overall_level.replace(/_/g, " ");
  const levelConfig =
    LEVEL_COLORS[report.overall_level as keyof typeof LEVEL_COLORS] ||
    LEVEL_COLORS.not_assessed;

  return (
    <div className="p-8 max-w-4xl">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Performance Report
        </h1>
        <ContextHelp page="report" />
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Overall Score</p>
            <p className="text-4xl font-bold text-gray-900">
              {report.overall_score.toFixed(1)}
              <span className="text-lg text-gray-400">/4.0</span>
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full border text-sm font-medium capitalize ${levelConfig}`}
          >
            {levelLabel}
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Competency Dimensions
        </h2>
        <div className="space-y-4">
          {Object.entries(report.dimension_scores).map(([key, dim]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {dim.label}
                </span>
                <span className="text-sm text-gray-500">
                  {dim.average_score.toFixed(1)}/4.0
                  <span className="text-gray-400 ml-1">
                    ({dim.count} actions)
                  </span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    SCORE_COLORS[Math.min(Math.round(dim.average_score) - 1, 3)] ||
                    "bg-gray-300"
                  }`}
                  style={{
                    width: `${(dim.average_score / 4) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Strengths
          </h2>
          {report.strengths.length > 0 ? (
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="font-medium text-green-700">
                    {s.dimension}
                  </span>{" "}
                  ({s.score.toFixed(1)}/4.0)
                  {s.detail && (
                    <p className="text-xs text-gray-500 mt-0.5">{s.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No data</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Areas for Improvement
          </h2>
          {report.improvements.length > 0 ? (
            <ul className="space-y-2">
              {report.improvements.map((imp, i) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="font-medium text-amber-700">
                    {imp.dimension}
                  </span>{" "}
                  ({imp.score.toFixed(1)}/4.0)
                  {imp.detail && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {imp.detail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No areas flagged</p>
          )}
        </div>
      </div>

      {/* Phase Narratives */}
      {Object.keys(report.phase_narratives).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Phase-by-Phase Analysis
          </h2>
          <div className="space-y-4">
            {Object.entries(report.phase_narratives).map(
              ([phase, narrative]) => (
                <div key={phase}>
                  <h3 className="text-sm font-medium text-blue-700 mb-1 capitalize">
                    {phase.replace(/-/g, " ")}
                  </h3>
                  <p className="text-sm text-gray-600">{narrative}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h2 className="font-semibold text-blue-900 mb-3">Recommendations</h2>
          <ul className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-800 flex gap-2">
                <span className="text-blue-400">&bull;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
