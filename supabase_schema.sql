-- ====================================================================
-- SUPABASE COMPLETE DATABASE REPLACEMENT & USER OWNERSHIP MIGRATION
-- Target Tables: public.habits, public.habit_completions, public.challenge_progress, public.tasks
-- Run this script in the Supabase SQL Editor.
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP 1: SAFELY DROP EMPTY LEGACY TABLES (IF THEY EXIST)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS public.habit_completions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.challenge_progress CASCADE;

-- --------------------------------------------------------------------
-- STEP 2: CREATE MODERN TABLES MATCHING REACT APP EXPECTATIONS
-- --------------------------------------------------------------------

-- 1. HABITS TABLE
CREATE TABLE public.habits (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
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

-- 2. HABIT COMPLETIONS TABLE
CREATE TABLE public.habit_completions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    daily_tracker_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    numeric_value NUMERIC,
    duration NUMERIC,
    time_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHALLENGE PROGRESS TABLE
CREATE TABLE public.challenge_progress (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TASKS TABLE
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    priority TEXT DEFAULT 'Medium',
    due_date DATE,
    due_time TIME,
    repeat_type TEXT DEFAULT 'None',
    habit_id TEXT REFERENCES public.habits(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- STEP 3: CREATE PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX idx_habit_completions_tracker_id ON public.habit_completions(daily_tracker_id);

CREATE INDEX idx_challenge_progress_user_id ON public.challenge_progress(user_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_habit_id ON public.tasks(habit_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- --------------------------------------------------------------------
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- STEP 5: CREATE PER-USER RLS POLICIES (TO AUTHENTICATED USERS)
-- --------------------------------------------------------------------

-- 1. habits RLS
CREATE POLICY "Users can manage their own habits"
ON public.habits
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. habit_completions RLS
CREATE POLICY "Users can manage their own habit completions"
ON public.habit_completions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. challenge_progress RLS
CREATE POLICY "Users can manage their own challenge progress"
ON public.challenge_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. tasks RLS
CREATE POLICY "Users can manage their own tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. expenses RLS
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    category TEXT DEFAULT 'Other',
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

