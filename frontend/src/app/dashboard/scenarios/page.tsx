"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getScenarios, createSession } from "@/lib/api";
import { Scenario } from "@/types";
import { Clock, Layers, Play } from "lucide-react";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [mode, setMode] = useState<string>("learning");
  const [difficulty, setDifficulty] = useState<string>("guided");
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getScenarios()
      .then(setScenarios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    if (!selectedScenario) return;
    setStarting(true);
    try {
      const session = await createSession({
        scenario_id: selectedScenario.id,
        mode,
        difficulty,
      });
      router.push(`/dashboard/session/${session.id}`);
    } catch (err) {
      console.error(err);
      setStarting(false);
    }
  };

  const modes = [
    {
      id: "learning",
      label: "Learning",
      desc: "Real-time coaching and hints",
    },
    {
      id: "assessment",
      label: "Assessment",
      desc: "Silent scoring, no hints",
    },
    {
      id: "hybrid",
      label: "Hybrid",
      desc: "Coaching first, then assessment",
    },
  ];

  const difficulties = [
    {
      id: "guided",
      label: "Guided",
      desc: "Simplified scenario with explicit prompts",
    },
    {
      id: "standard",
      label: "Standard",
      desc: "Full complexity, no hand-holding",
    },
    {
      id: "advanced",
      label: "Advanced",
      desc: "Uncooperative parties, fraud indicators",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Scenarios</h1>
      <p className="text-gray-500 mb-8">
        Choose a scenario, mode, and difficulty to start a new simulation
      </p>

      {/* Scenario selection */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Select Scenario
        </h2>
        <div className="grid gap-4">
          {scenarios.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedScenario(s)}
              className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${
                selectedScenario?.id === s.id
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{s.description}</p>
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {s.estimated_duration?.guided || 30}-{s.estimated_duration?.advanced || 60} min
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {s.phases?.length || 7} phases
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedScenario && (
        <>
          {/* Mode selection */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Simulation Mode
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === m.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    difficulty === d.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{d.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={starting}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <Play className="h-4 w-4" />
            {starting ? "Starting..." : "Start Simulation"}
          </button>
        </>
      )}
    </div>
  );
}
