-- SQL Schema for Gozi Application

-- 1. Profiles (User subscription & metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- references auth.users.id
    name TEXT,
    email TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_tier TEXT DEFAULT 'Free',
    last_survey_date TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chat Messages (User chat history with AI companion)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    suggestions JSONB DEFAULT '[]'::jsonb,
    proactive_suggestion JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inventory Items (User logged items for activity matching)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    confidence TEXT,
    interest TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Preferences (User companion preferences & settings)
CREATE TABLE IF NOT EXISTS public.preferences (
    id TEXT PRIMARY KEY, -- same as user_id / profiles.id
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    living_situation TEXT,
    partner_username TEXT,
    energy_defaults TEXT,
    hobbies JSONB DEFAULT '[]'::jsonb,
    digital_apps JSONB DEFAULT '[]'::jsonb,
    saved_cures JSONB DEFAULT '[]'::jsonb,
    daily_refresh_history JSONB DEFAULT '[]'::jsonb,
    completed_suggestions JSONB DEFAULT '[]'::jsonb,
    data_migrated BOOLEAN DEFAULT FALSE
);

-- 5. Weekly Reflections (User survey data)
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    responses JSONB NOT NULL
);


-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow users to view own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid()::text = id);

CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid()::text = id);

CREATE POLICY "Allow users to delete own profile" ON public.profiles
    FOR DELETE TO authenticated USING (auth.uid()::text = id);

-- Chat Messages Policies
CREATE POLICY "Allow users to view own chat messages" ON public.chat_messages
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to insert own chat messages" ON public.chat_messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to update own chat messages" ON public.chat_messages
    FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete own chat messages" ON public.chat_messages
    FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Inventory Items Policies
CREATE POLICY "Allow users to view own inventory items" ON public.inventory_items
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to insert own inventory items" ON public.inventory_items
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to update own inventory items" ON public.inventory_items
    FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete own inventory items" ON public.inventory_items
    FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Preferences Policies
CREATE POLICY "Allow users to view own preferences" ON public.preferences
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to insert own preferences" ON public.preferences
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to update own preferences" ON public.preferences
    FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete own preferences" ON public.preferences
    FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Weekly Reflections Policies
CREATE POLICY "Allow users to view own weekly reflections" ON public.weekly_reflections
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to insert own weekly reflections" ON public.weekly_reflections
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to update own weekly reflections" ON public.weekly_reflections
    FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to delete own weekly reflections" ON public.weekly_reflections
    FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
