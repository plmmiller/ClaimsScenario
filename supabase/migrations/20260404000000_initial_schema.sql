-- Claims Simulation Platform - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'learner'
    CHECK (role IN ('learner', 'instructor', 'admin')),
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SESSIONS
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('learning', 'assessment', 'hybrid')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('guided', 'standard', 'advanced')),
  current_phase TEXT NOT NULL DEFAULT 'fnol',
  phase_history JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  decisions JSONB NOT NULL DEFAULT '[]',
  documents_accessed JSONB NOT NULL DEFAULT '[]',
  scoring_events JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('user', 'assistant', 'system', 'tool_call', 'tool_result')),
  persona TEXT,
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  phase TEXT NOT NULL,
  sequence_num INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_sequence ON messages(session_id, sequence_num);

-- ============================================
-- REPORTS
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  overall_score NUMERIC(5,2) NOT NULL,
  overall_level TEXT NOT NULL
    CHECK (overall_level IN ('exemplary', 'proficient', 'developing', 'needs_improvement')),
  dimension_scores JSONB NOT NULL,
  phase_narratives JSONB NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  improvements JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own; instructors/admins can read all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Instructors and admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Sessions: users can CRUD their own; instructors/admins can read all
CREATE POLICY "Users can manage own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors and admins can read all sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'admin')
    )
  );

-- Messages: same as sessions
CREATE POLICY "Users can manage own messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = messages.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors and admins can read all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'admin')
    )
  );

-- Reports: users can read their own; instructors/admins can read all
CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors and admins can read all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'admin')
    )
  );

-- Service role key (used by backend) bypasses RLS automatically
