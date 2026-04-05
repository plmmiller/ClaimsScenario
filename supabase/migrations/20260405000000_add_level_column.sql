ALTER TABLE sessions ADD COLUMN level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'experienced'));
