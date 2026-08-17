-- ====================================================================
-- SUPABASE EXPENSES TABLE & RLS POLICY MIGRATION
-- Run this script in the Supabase SQL Editor.
-- ====================================================================

-- 1. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense', -- 'income' or 'expense'
    category TEXT DEFAULT 'Other',
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. CREATE PER-USER RLS POLICY (FOR AUTHENTICATED USERS)
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
