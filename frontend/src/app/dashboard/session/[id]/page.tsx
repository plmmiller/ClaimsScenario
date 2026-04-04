"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/api";
import { streamMessage, SSECallbacks } from "@/lib/sse";
import { useAuth } from "@/providers/AuthProvider";
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
  Loader2,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  persona?: PersonaInfo;
  type?: "document" | "coaching" | "score" | "phase_change" | "simulation_complete";
  metadata?: Record<string, unknown>;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamBuffer, scrollToBottom]);

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
        // If there was accumulated text, save it as a message
        if (assistantText.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}-${Math.random()}`,
              role: "assistant",
              content: assistantText,
              persona: assistantPersona || undefined,
            },
          ]);
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
        setMessages((prev) => [
          ...prev,
          {
            id: `score-${Date.now()}`,
            role: "system",
            content: `${data.dimension.replace(/_/g, " ")}: ${data.score}/4 — ${data.feedback}`,
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
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: assistantText,
              persona: assistantPersona || undefined,
            },
          ]);
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
          {session?.status === "completed" && (
            <button
              onClick={() => router.push(`/dashboard/report/${sessionId}`)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              View Report
            </button>
          )}
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
              disabled={isStreaming || session?.status !== "active"}
              placeholder={
                session?.status !== "active"
                  ? "Session is not active"
                  : "Type your message... (Enter to send, Shift+Enter for new line)"
              }
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:opacity-50"
            />
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
