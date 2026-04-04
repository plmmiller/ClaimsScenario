"use client";

import { useEffect, useState } from "react";
import { getAnalytics } from "@/lib/api";
import { BarChart3, Users, Activity, Trophy } from "lucide-react";

interface Analytics {
  total_sessions: number;
  completed_sessions: number;
  active_sessions: number;
  completion_rate: number;
  mode_distribution: Record<string, number>;
  difficulty_distribution: Record<string, number>;
  average_score: number | null;
  total_reports: number;
}

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Total Sessions",
      value: data.total_sessions,
      icon: Activity,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: data.completed_sessions,
      icon: Trophy,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Active",
      value: data.active_sessions,
      icon: Users,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Avg Score",
      value: data.average_score ? `${data.average_score.toFixed(1)}/4` : "N/A",
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
      <p className="text-gray-500 mb-8">Platform-wide training metrics</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Mode Distribution
          </h3>
          {Object.entries(data.mode_distribution).map(([mode, count]) => (
            <div
              key={mode}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm capitalize">{mode}</span>
              <span className="text-sm font-medium">{count}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Difficulty Distribution
          </h3>
          {Object.entries(data.difficulty_distribution).map(
            ([diff, count]) => (
              <div
                key={diff}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm capitalize">{diff}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">
          Completion Rate
        </h3>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${data.completion_rate * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {(data.completion_rate * 100).toFixed(1)}% of sessions completed
        </p>
      </div>
    </div>
  );
}
