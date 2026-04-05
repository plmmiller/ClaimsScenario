const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getToken(): Promise<string | null> {
  // Import dynamically to avoid SSR issues
  const { createClient } = await import("./supabase-browser");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function fetchAPI(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || res.statusText);
  }
  return res.json();
}

// Scenarios
export const getScenarios = () => fetchAPI("/api/scenarios");
export const getScenario = (id: string) => fetchAPI(`/api/scenarios/${id}`);

// Sessions
export const createSession = (data: {
  scenario_id: string;
  mode: string;
  difficulty: string;
  level: string;
}) => fetchAPI("/api/sessions", { method: "POST", body: JSON.stringify(data) });

export const getSessions = (limit = 20, offset = 0) =>
  fetchAPI(`/api/sessions?limit=${limit}&offset=${offset}`);

export const getSession = (id: string) => fetchAPI(`/api/sessions/${id}`);

export const updateSession = (id: string, data: { status: string }) =>
  fetchAPI(`/api/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteSession = (id: string) =>
  fetchAPI(`/api/sessions/${id}`, { method: "DELETE" });

// Progress
export const getProgress = (sessionId: string) =>
  fetchAPI(`/api/sessions/${sessionId}/progress`);

// Reports
export const generateReport = (sessionId: string) =>
  fetchAPI(`/api/sessions/${sessionId}/generate-report`, { method: "POST" });

export const getReport = (sessionId: string) =>
  fetchAPI(`/api/sessions/${sessionId}/report`);

// Admin
export const getAnalytics = () => fetchAPI("/api/admin/analytics");
export const getUsers = () => fetchAPI("/api/admin/users");
export const getTranscript = (sessionId: string) =>
  fetchAPI(`/api/admin/sessions/${sessionId}/transcript`);
