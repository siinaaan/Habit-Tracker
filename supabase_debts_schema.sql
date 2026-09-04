-- ====================================================================
-- SUPABASE DEBTS & DEBT REPAYMENTS TABLE & RLS POLICY MIGRATION
-- Run this script in the Supabase SQL Editor.
-- ====================================================================

-- 1. CREATE DEBTS TABLE
CREATE TABLE IF NOT EXISTS public.debts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    type TEXT NOT NULL CHECK (type IN ('to_get', 'to_give')),
    person_name TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE DEBT REPAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.debt_repayments (
    id TEXT PRIMARY KEY,
    debt_id TEXT NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_date ON public.debts(date);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_type ON public.debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);

CREATE INDEX IF NOT EXISTS idx_debt_repayments_debt_id ON public.debt_repayments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_repayments_user_id ON public.debt_repayments(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_repayments_date ON public.debt_repayments(date);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_repayments ENABLE ROW LEVEL SECURITY;

-- 5. CREATE PER-USER RLS POLICIES (FOR AUTHENTICATED USERS)
DROP POLICY IF EXISTS "Users can manage their own debts" ON public.debts;
CREATE POLICY "Users can manage their own debts"
ON public.debts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own debt repayments" ON public.debt_repayments;
CREATE POLICY "Users can manage their own debt repayments"
ON public.debt_repayments
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. ENABLE SUPABASE REALTIME (IF PUBLICATION EXISTS)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_repayments;
    END IF;
END $$;
