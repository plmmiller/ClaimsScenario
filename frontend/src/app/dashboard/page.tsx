"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessions, deleteSession } from "@/lib/api";
import { Session, PHASE_LABELS } from "@/types";
import { Play, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: Play },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  abandoned: { label: "Abandoned", color: "bg-gray-100 text-gray-500", icon: AlertCircle },
};

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this simulation? This cannot be undone.")) return;
    setDeleting(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your simulation sessions</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/scenarios")}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Play className="h-4 w-4" />
          New Simulation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No simulations yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start your first claims simulation to begin training
          </p>
          <button
            onClick={() => router.push("/dashboard/scenarios")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Browse Scenarios
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const config = STATUS_CONFIG[session.status];
            const Icon = config.icon;
            const isDeleting = deleting === session.id;
            return (
              <div
                key={session.id}
                onClick={() => {
                  if (isDeleting) return;
                  if (session.status === "completed") {
                    router.push(`/dashboard/report/${session.id}`);
                  } else if (session.status === "active") {
                    router.push(`/dashboard/session/${session.id}`);
                  }
                }}
                className={`bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 cursor-pointer transition-colors ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {session.scenario_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {session.mode} mode &middot; {session.difficulty} difficulty &middot;{" "}
                        {session.level || "beginner"} level &middot;{" "}
                        {PHASE_LABELS[session.current_phase] || session.current_phase}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(session.started_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete simulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
