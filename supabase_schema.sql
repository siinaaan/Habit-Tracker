-- Supabase Database Migration Schema
-- Includes tables for: habits, habit_completions, challenge_progress, tasks
-- Run this script in your Supabase SQL Editor if tables do not exist yet.

-- 1. HABITS TABLE
CREATE TABLE IF NOT EXISTS public.habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Custom',
    icon TEXT DEFAULT '⚡',
    type TEXT DEFAULT 'checkbox',
    target NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'bool',
    frequency TEXT DEFAULT 'daily',
    active BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to habits" ON public.habits;
CREATE POLICY "Allow public full access to habits"
ON public.habits
FOR ALL
USING (true)
WITH CHECK (true);


-- 2. HABIT COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    daily_tracker_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    numeric_value NUMERIC,
    duration NUMERIC,
    time_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to habit_completions" ON public.habit_completions;
CREATE POLICY "Allow public full access to habit_completions"
ON public.habit_completions
FOR ALL
USING (true)
WITH CHECK (true);


-- 3. CHALLENGE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to challenge_progress" ON public.challenge_progress;
CREATE POLICY "Allow public full access to challenge_progress"
ON public.challenge_progress
FOR ALL
USING (true)
WITH CHECK (true);


-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    priority TEXT DEFAULT 'Medium',
    due_date DATE,
    due_time TIME,
    repeat_type TEXT DEFAULT 'None',
    habit_id TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to tasks" ON public.tasks;
CREATE POLICY "Allow public full access to tasks"
ON public.tasks
FOR ALL
USING (true)
WITH CHECK (true);
