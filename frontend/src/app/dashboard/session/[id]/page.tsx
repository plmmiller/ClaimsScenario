"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession, getProgress, transcribeAudio, fetchSpeech } from "@/lib/api";
import { streamMessage, SSECallbacks } from "@/lib/sse";
import { useAuth } from "@/providers/AuthProvider";
import ContextHelp from "@/components/ContextHelp";
import {
  Session,
  Message,
  PersonaInfo,
  Phase,
  PHASE_LABELS,
  PHASE_ORDER,
  PERSONA_COLORS,
} from "@/types";
import {
  Send,
  FileText,
  MessageSquare,
  Lightbulb,
  Award,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  BarChart3,
  CheckCircle2,
  Circle,
  TrendingUp,
  Quote,
  Target,
  ArrowUpRight,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  persona?: PersonaInfo;
  type?: "document" | "coaching" | "score" | "phase_change" | "simulation_complete";
  metadata?: Record<string, unknown>;
}

interface ScoreExplanation {
  score: number;
  level: string;
  action: string;
  feedback: string;
  what_was_expected: string;
  evidence: string[];
  improvement_tip: string;
  phase: string;
  timestamp: string;
}

interface DimensionScore {
  label: string;
  average_score: number;
  count: number;
  weight: number;
  weighted_score: number;
  level: string;
  explanations: ScoreExplanation[];
  strongest_action: string;
  weakest_action: string;
}

interface ProgressData {
  mode: string;
  current_phase: string;
  phase_tasks: { action: string; completed: boolean }[];
  phases_completed: number;
  phases_total: number;
  dimension_scores: Record<string, DimensionScore>;
  overall_score: number;
  overall_level: string;
  scoring_events_count: number;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { session: authSession } = useAuth();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [currentPersona, setCurrentPersona] = useState<PersonaInfo | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("fnol");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentsViewed, setDocumentsViewed] = useState<string[]>([]);
  const [coachingMessages, setCoachingMessages] = useState<
    { type: string; hint: string }[]
  >([]);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamBuffer, scrollToBottom]);

  const fetchProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      const data = await getProgress(sessionId);
      setProgressData(data);
      setProgressOpen(true);
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setProgressLoading(false);
    }
  }, [sessionId]);

  // Load session
  useEffect(() => {
    getSession(sessionId)
      .then((data) => {
        setSession(data.session);
        setCurrentPhase(data.session.current_phase);
        setDocumentsViewed(data.session.documents_accessed || []);
        // Convert stored messages
        const chatMessages: ChatMessage[] = data.messages.map(
          (m: Message) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            persona: m.persona
              ? { persona_id: m.persona, name: m.persona, role: "" }
              : undefined,
          })
        );
        setMessages(chatMessages);
      })
      .catch(console.error);
  }, [sessionId]);

  // Play persona speech for a finished AI response
  const playSpeech = useCallback(
    async (text: string, personaId?: string) => {
      if (!audioEnabled || !text.trim()) return;
      try {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        }
        const blob = await fetchSpeech(text, personaId);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) currentAudioRef.current = null;
        };
        await audio.play();
      } catch (err) {
        console.error("TTS error:", err);
      }
    },
    [audioEnabled]
  );

  // Start / stop microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob);
          if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
        } catch (err) {
          console.error("Transcription error:", err);
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Unable to access microphone. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      // If disabling, stop any currently playing audio
      if (!next && currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !authSession?.access_token) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setStreamBuffer("");

    let assistantText = "";
    let assistantPersona: PersonaInfo | null = null;

    const callbacks: SSECallbacks = {
      onToken: (text) => {
        assistantText += text;
        setStreamBuffer(assistantText);
      },
      onPersona: (data) => {
        // If there was accumulated text, save it as a message and speak it
        if (assistantText.trim()) {
          const spokenText = assistantText;
          const spokenPersona = assistantPersona;
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}-${Math.random()}`,
              role: "assistant",
              content: spokenText,
              persona: spokenPersona || undefined,
            },
          ]);
          playSpeech(spokenText, spokenPersona?.persona_id);
          assistantText = "";
          setStreamBuffer("");
        }
        assistantPersona = data;
        setCurrentPersona(data);
      },
      onToolCall: () => {},
      onToolResult: (data) => {
        if (data.tool === "show_document" && data.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: `doc-${Date.now()}`,
              role: "system",
              content: data.content!,
              type: "document",
              metadata: { document_id: data.document_id || "" },
            },
          ]);
          if (data.document_id) {
            setDocumentsViewed((prev) =>
              prev.includes(data.document_id!)
                ? prev
                : [...prev, data.document_id!]
            );
          }
        }
      },
      onPhaseChange: (data) => {
        setCurrentPhase(data.to as Phase);
        setMessages((prev) => [
          ...prev,
          {
            id: `phase-${Date.now()}`,
            role: "system",
            content: `Phase transition: ${PHASE_LABELS[data.from as Phase]} → ${PHASE_LABELS[data.to as Phase]}\n\n${data.summary}`,
            type: "phase_change",
          },
        ]);
      },
      onCoaching: (data) => {
        setCoachingMessages((prev) => [...prev, data]);
        setMessages((prev) => [
          ...prev,
          {
            id: `coaching-${Date.now()}`,
            role: "system",
            content: data.hint,
            type: "coaching",
            metadata: { coaching_type: data.type },
          },
        ]);
      },
      onScoreEvent: (data) => {
        const parts = [`**${data.dimension.replace(/_/g, " ")}**: ${data.score}/4 — ${data.feedback}`];
        if (data.evidence && data.evidence.length > 0) {
          parts.push(`\n**Evidence:** ${data.evidence.map((e: string) => `"${e}"`).join("; ")}`);
        }
        if (data.what_was_expected) {
          parts.push(`\n**Exemplary response:** ${data.what_was_expected}`);
        }
        if (data.improvement_tip) {
          parts.push(`\n**Tip:** ${data.improvement_tip}`);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `score-${Date.now()}`,
            role: "system",
            content: parts.join(""),
            type: "score",
          },
        ]);
      },
      onSimulationComplete: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `complete-${Date.now()}`,
            role: "system",
            content: `Simulation complete: ${data.summary}`,
            type: "simulation_complete",
          },
        ]);
        // Refresh session to get updated status
        getSession(sessionId).then((d) => setSession(d.session));
      },
      onDone: () => {
        if (assistantText.trim()) {
          const spokenText = assistantText;
          const spokenPersona = assistantPersona;
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: spokenText,
              persona: spokenPersona || undefined,
            },
          ]);
          playSpeech(spokenText, spokenPersona?.persona_id);
        }
        setStreamBuffer("");
        setIsStreaming(false);
      },
      onError: (msg) => {
        console.error("SSE error:", msg);
        setStreamBuffer("");
        setIsStreaming(false);
      },
    };

    await streamMessage(
      sessionId,
      userMessage.content,
      authSession.access_token,
      callbacks
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const phaseIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Session Info</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {session && (
            <div className="p-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Mode
                </p>
                <p className="font-medium capitalize">{session.mode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Difficulty
                </p>
                <p className="font-medium capitalize">{session.difficulty}</p>
              </div>
            </div>
          )}

          {/* Phase tracker */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Claims Lifecycle
            </p>
            <div className="space-y-1">
              {PHASE_ORDER.map((phase, idx) => {
                const isCurrent = phase === currentPhase;
                const isCompleted = idx < phaseIndex;
                return (
                  <div
                    key={phase}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                      isCurrent
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCurrent
                          ? "bg-blue-500"
                          : isCompleted
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    {PHASE_LABELS[phase]}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents accessed */}
          {documentsViewed.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Documents
              </p>
              {documentsViewed.map((doc) => (
                <div
                  key={doc}
                  className="flex items-center gap-2 text-xs text-gray-600 py-1"
                >
                  <FileText className="h-3 w-3" />
                  {doc.replace(/-/g, " ")}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-400 hover:text-gray-600 mr-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <span className="text-sm font-medium text-blue-600">
              {PHASE_LABELS[currentPhase]}
            </span>
            {currentPersona && currentPersona.persona_id !== "system" && (
              <>
                <span className="text-gray-300">&middot;</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        PERSONA_COLORS[currentPersona.persona_id] || "#6B7280",
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    Speaking with {currentPersona.name}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              title={audioEnabled ? "Mute AI voice" : "Enable AI voice"}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {session?.status === "active" && (
              <button
                onClick={fetchProgress}
                disabled={progressLoading}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {progressLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : session.mode === "assessment" ? (
                  <BarChart3 className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {session.mode === "assessment" ? "Score" : "Progress"}
              </button>
            )}
            {session?.status === "completed" && (
              <button
                onClick={() => router.push(`/dashboard/report/${sessionId}`)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                View Report
              </button>
            )}
            <ContextHelp
              page="session"
              phase={currentPhase}
              mode={session?.mode}
              scenarioId={session?.scenario_id}
              difficulty={session?.difficulty}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-16">
              <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Start the simulation by introducing yourself or asking a
                question
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Streaming indicator */}
          {isStreaming && streamBuffer && (
            <div className="flex gap-3">
              <PersonaAvatar persona={currentPersona} />
              <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-4 py-3 max-w-[70%]">
                <p className="text-sm whitespace-pre-wrap">{streamBuffer}</p>
                <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5" />
              </div>
            </div>
          )}

          {isStreaming && !streamBuffer && (
            <div className="flex gap-3 items-center">
              <PersonaAvatar persona={currentPersona} />
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || session?.status !== "active" || isTranscribing}
              placeholder={
                session?.status !== "active"
                  ? "Session is not active"
                  : isTranscribing
                  ? "Transcribing..."
                  : isRecording
                  ? "Recording... click mic to stop"
                  : "Type your message... (Enter to send, Shift+Enter for new line)"
              }
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:opacity-50"
            />
            <button
              onClick={toggleRecording}
              disabled={isStreaming || session?.status !== "active" || isTranscribing}
              title={isRecording ? "Stop recording" : "Record voice message"}
              className={`px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Panel (slide-over from right) */}
      {progressOpen && progressData && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {progressData.mode === "assessment" ? (
                <>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Running Score
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Phase Progress
                </>
              )}
            </h3>
            <button
              onClick={() => setProgressOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Phase progress bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Overall Progress</span>
              <span>{progressData.phases_completed}/{progressData.phases_total} phases</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(progressData.phases_completed / progressData.phases_total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Current: <span className="font-medium text-gray-700">{PHASE_LABELS[progressData.current_phase] || progressData.current_phase}</span>
            </p>
          </div>

          {/* Learning mode: task checklist */}
          {progressData.mode !== "assessment" && progressData.phase_tasks.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                Phase Tasks
              </p>
              <div className="space-y-2">
                {progressData.phase_tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-xs ${
                      task.completed ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={task.completed ? "line-through opacity-70" : ""}>
                      {task.action}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {progressData.phase_tasks.filter((t) => t.completed).length}/
                {progressData.phase_tasks.length} completed
              </p>
            </div>
          )}

          {/* Score section (always shown in assessment, shown with scores in learning/hybrid) */}
          {(progressData.mode === "assessment" || progressData.scoring_events_count > 0) && (
            <div className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                {progressData.mode === "assessment" ? "Score Breakdown" : "Running Scores"}
              </p>

              {/* Overall score */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Overall</span>
                  <span className={`text-lg font-bold ${
                    progressData.overall_score >= 3.5
                      ? "text-green-600"
                      : progressData.overall_score >= 2.5
                      ? "text-blue-600"
                      : progressData.overall_score >= 1.5
                      ? "text-yellow-600"
                      : progressData.overall_score > 0
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}>
                    {progressData.overall_score > 0
                      ? `${progressData.overall_score}/4.0`
                      : "—"}
                  </span>
                </div>
                {progressData.overall_score > 0 && (
                  <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                    progressData.overall_level === "exemplary"
                      ? "bg-green-100 text-green-700"
                      : progressData.overall_level === "proficient"
                      ? "bg-blue-100 text-blue-700"
                      : progressData.overall_level === "developing"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {progressData.overall_level.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {/* Dimension scores with expandable explanations */}
              <div className="space-y-2">
                {Object.entries(progressData.dimension_scores).map(([key, dim]) => {
                  const isExpanded = expandedDimensions.has(key);
                  const toggleExpand = () => {
                    setExpandedDimensions((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  };

                  return (
                    <div key={key} className="rounded-lg border border-gray-100 overflow-hidden">
                      {/* Dimension header — clickable to expand */}
                      <button
                        onClick={dim.count > 0 ? toggleExpand : undefined}
                        className={`w-full text-left p-2.5 ${dim.count > 0 ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 flex items-center gap-1">
                            {dim.count > 0 && (
                              isExpanded
                                ? <ChevronDown className="h-3 w-3 text-gray-400" />
                                : <ChevronRight className="h-3 w-3 text-gray-400" />
                            )}
                            {dim.label}
                          </span>
                          <span className="font-medium text-gray-700">
                            {dim.count > 0 ? `${dim.average_score}/4` : "—"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              dim.average_score >= 3.5
                                ? "bg-green-500"
                                : dim.average_score >= 2.5
                                ? "bg-blue-500"
                                : dim.average_score >= 1.5
                                ? "bg-yellow-500"
                                : dim.count > 0
                                ? "bg-red-500"
                                : "bg-gray-300"
                            }`}
                            style={{
                              width: dim.count > 0 ? `${(dim.average_score / 4) * 100}%` : "0%",
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs mt-0.5">
                          <span className="text-gray-400">
                            {Math.round(dim.weight * 100)}% weight
                          </span>
                          {dim.count > 0 && (
                            <span className="text-gray-400">{dim.count} eval{dim.count !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </button>

                      {/* Expanded explanation panel */}
                      {isExpanded && dim.explanations && dim.explanations.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-3">
                          {dim.explanations.map((exp, idx) => (
                            <div key={idx} className="text-xs space-y-1.5 pb-2 border-b border-gray-200 last:border-b-0 last:pb-0">
                              {/* Score badge + phase */}
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                  exp.score >= 4 ? "bg-green-100 text-green-700"
                                    : exp.score >= 3 ? "bg-blue-100 text-blue-700"
                                    : exp.score >= 2 ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {exp.score}/4 · {exp.level.replace(/_/g, " ")}
                                </span>
                                <span className="text-gray-400 text-xs">{exp.phase}</span>
                              </div>

                              {/* What you did */}
                              <div>
                                <p className="text-gray-500 font-medium mb-0.5">What you did:</p>
                                <p className="text-gray-700">{exp.action}</p>
                              </div>

                              {/* Evidence from your response */}
                              {exp.evidence && exp.evidence.length > 0 && (
                                <div>
                                  <p className="text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                                    <Quote className="h-3 w-3" /> Evidence:
                                  </p>
                                  <ul className="space-y-0.5 ml-3">
                                    {exp.evidence.map((e, i) => (
                                      <li key={i} className="text-gray-600 italic">&ldquo;{e}&rdquo;</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Feedback */}
                              <div>
                                <p className="text-gray-500 font-medium mb-0.5">Feedback:</p>
                                <p className="text-gray-700">{exp.feedback}</p>
                              </div>

                              {/* What was expected */}
                              {exp.what_was_expected && (
                                <div className="bg-blue-50 rounded p-2">
                                  <p className="text-blue-700 font-medium mb-0.5 flex items-center gap-1">
                                    <Target className="h-3 w-3" /> What exemplary looks like:
                                  </p>
                                  <p className="text-blue-600">{exp.what_was_expected}</p>
                                </div>
                              )}

                              {/* Improvement tip */}
                              {exp.improvement_tip && (
                                <div className="bg-amber-50 rounded p-2">
                                  <p className="text-amber-700 font-medium mb-0.5 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3" /> Tip to improve:
                                  </p>
                                  <p className="text-amber-600">{exp.improvement_tip}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {progressData.scoring_events_count === 0 && (
                <p className="text-xs text-gray-400 mt-3 text-center italic">
                  No scoring events yet. Continue the simulation to build your score.
                </p>
              )}
            </div>
          )}

          {/* Refresh button */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <button
              onClick={fetchProgress}
              disabled={progressLoading}
              className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {progressLoading ? "Refreshing..." : "Refresh Progress"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaAvatar({
  persona,
}: {
  persona: PersonaInfo | null;
}) {
  const color = persona
    ? PERSONA_COLORS[persona.persona_id] || "#6B7280"
    : "#6B7280";
  const initial = persona?.name?.[0] || "S";

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-xl rounded-tr-sm px-4 py-3 max-w-[70%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "document") {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-gray-500" />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-[80%]">
          <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">
            {String(message.metadata?.document_id || "Document").replace(/-/g, " ")}
          </p>
          <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "coaching") {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Lightbulb className="h-4 w-4 text-green-600" />
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 max-w-[70%]">
          <p className="text-xs font-semibold text-green-700 mb-1">
            Coaching Tip
          </p>
          <p className="text-sm text-green-800">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "score") {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <Award className="h-4 w-4 text-purple-600" />
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 max-w-[70%]">
          <p className="text-sm text-purple-800">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "phase_change") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-700 font-medium">
          {message.content.split("\n")[0]}
        </div>
      </div>
    );
  }

  if (message.type === "simulation_complete") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center">
          <p className="text-sm font-medium text-green-700 mb-1">
            Simulation Complete
          </p>
          <p className="text-xs text-green-600">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3">
      <PersonaAvatar persona={message.persona || null} />
      <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-4 py-3 max-w-[70%]">
        {message.persona && message.persona.persona_id !== "system" && (
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {message.persona.name}
            {message.persona.role && (
              <span className="font-normal text-gray-400">
                {" "}
                &middot; {message.persona.role}
              </span>
            )}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
