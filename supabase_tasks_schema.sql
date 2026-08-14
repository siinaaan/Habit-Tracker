-- Supabase Table Migration: tasks
-- Run this in your Supabase SQL Editor if the tasks table does not exist yet.

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

-- Enable Row Level Security (RLS) or grant public access depending on your setup
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access to tasks"
ON public.tasks
FOR ALL
USING (true)
WITH CHECK (true);
