const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SSECallbacks {
  onToken: (text: string) => void;
  onPersona: (data: {
    persona_id: string;
    name: string;
    role: string;
  }) => void;
  onToolCall: (data: { tool: string; input: Record<string, unknown> }) => void;
  onToolResult: (data: {
    tool: string;
    document_id?: string;
    content?: string;
  }) => void;
  onPhaseChange: (data: { from: string; to: string; summary: string }) => void;
  onCoaching: (data: {
    type: string;
    hint: string;
    dimension?: string;
  }) => void;
  onScoreEvent: (data: {
    dimension: string;
    score: number;
    feedback: string;
  }) => void;
  onSimulationComplete: (data: {
    reason: string;
    summary: string;
  }) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

export async function streamMessage(
  sessionId: string,
  content: string,
  token: string,
  callbacks: SSECallbacks
): Promise<void> {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Stream error" }));
    callbacks.onError(body.detail || response.statusText);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ") && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            dispatchEvent(currentEvent, data, callbacks);
          } catch {
            // Skip malformed JSON
          }
          currentEvent = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone();
}

function dispatchEvent(
  event: string,
  data: Record<string, unknown>,
  callbacks: SSECallbacks
) {
  switch (event) {
    case "token":
      callbacks.onToken(data.text as string);
      break;
    case "persona":
      callbacks.onPersona(
        data as { persona_id: string; name: string; role: string }
      );
      break;
    case "tool_call":
      callbacks.onToolCall(
        data as { tool: string; input: Record<string, unknown> }
      );
      break;
    case "tool_result":
      callbacks.onToolResult(data as { tool: string; document_id?: string; content?: string });
      break;
    case "phase_change":
      callbacks.onPhaseChange(
        data as { from: string; to: string; summary: string }
      );
      break;
    case "coaching":
      callbacks.onCoaching(
        data as { type: string; hint: string; dimension?: string }
      );
      break;
    case "score_event":
      callbacks.onScoreEvent(
        data as { dimension: string; score: number; feedback: string }
      );
      break;
    case "simulation_complete":
      callbacks.onSimulationComplete(data as { reason: string; summary: string });
      break;
    case "done":
      // Handled after loop
      break;
    case "error":
      callbacks.onError((data.message as string) || "Unknown error");
      break;
  }
}
