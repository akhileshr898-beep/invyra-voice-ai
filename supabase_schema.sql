-- ==========================================================
-- AI-Powered Voice Assistant & Multi-Tenant Isolated Schema
-- Compatible with Supabase (PostgreSQL) + Row Level Security (RLS)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Business Owners & Operators)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT ('u-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    email TEXT UNIQUE NOT NULL,
    owner_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    reset_token TEXT,
    reset_token_expiry BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Businesses Table (Tenant Entity)
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY DEFAULT ('b-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    owner_name TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    business_address TEXT,
    preferred_language TEXT DEFAULT 'English & Hindi',
    timezone TEXT DEFAULT 'America/New_York',
    operating_hours TEXT DEFAULT 'Mon-Sat 8:30 AM - 7:00 PM',
    tone TEXT DEFAULT 'Empathetic, reassuring, professional and efficient.',
    google_calendar_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workflows Table (Configurable Call Flows per Tenant)
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY DEFAULT ('wf-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger TEXT DEFAULT 'missed_call',
    greeting TEXT NOT NULL,
    fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    urgency_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    conditional_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_after_collection TEXT NOT NULL DEFAULT 'create_calendar_event',
    closing_message TEXT DEFAULT 'Thank you! Your information has been securely noted.',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer Conversations & Missed-Call Records (Tenant-Isolated)
CREATE TABLE IF NOT EXISTS customer_conversations (
    id TEXT PRIMARY KEY DEFAULT ('conv-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    workflow_id TEXT REFERENCES workflows(id) ON DELETE SET NULL,
    caller_name TEXT NOT NULL,
    caller_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'in_progress', 'completed', 'failed', 'cancelled'
    intent TEXT,
    collected_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary TEXT,
    action_performed TEXT,
    priority TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'high', 'urgent'
    follow_up_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'completed', 'closed'
    transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    language TEXT DEFAULT 'en', -- 'en', 'hi', 'bilingual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Calendar Events (Appointments & Scheduled Callbacks)
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY DEFAULT ('cal-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES customer_conversations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_phone TEXT NOT NULL,
    doctor_or_service TEXT,
    notes TEXT,
    google_event_id TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'rescheduled', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance querying & isolation
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_business ON workflows(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON customer_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON customer_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_follow_up ON customer_conversations(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON customer_conversations(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_business ON calendar_events(business_id);
CREATE INDEX IF NOT EXISTS idx_calendar_start_time ON calendar_events(start_time ASC);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 1. Users RLS: Users can only see and edit their own account
CREATE POLICY "Users can only access their own user record"
    ON users
    FOR ALL
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- 2. Businesses RLS: Owners can only SELECT, INSERT, UPDATE, DELETE their own businesses
CREATE POLICY "Owners can view their own businesses"
    ON businesses
    FOR SELECT
    USING (owner_user_id = auth.uid()::text);

CREATE POLICY "Owners can create businesses for themselves"
    ON businesses
    FOR INSERT
    WITH CHECK (owner_user_id = auth.uid()::text);

CREATE POLICY "Owners can update their own businesses"
    ON businesses
    FOR UPDATE
    USING (owner_user_id = auth.uid()::text)
    WITH CHECK (owner_user_id = auth.uid()::text);

CREATE POLICY "Owners can delete their own businesses"
    ON businesses
    FOR DELETE
    USING (owner_user_id = auth.uid()::text);

-- 3. Workflows RLS: Only accessible if business belongs to authenticated owner
CREATE POLICY "Owners can manage workflows of their own businesses"
    ON workflows
    FOR ALL
    USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text));

-- 4. Customer Conversations RLS: Only accessible by business owner
CREATE POLICY "Owners can view conversations of their own businesses"
    ON customer_conversations
    FOR SELECT
    USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text));

CREATE POLICY "Owners can update conversations of their own businesses"
    ON customer_conversations
    FOR UPDATE
    USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text));

CREATE POLICY "Owners can delete conversations of their own businesses"
    ON customer_conversations
    FOR DELETE
    USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text));

-- 5. Calendar Events RLS: Only accessible by business owner
CREATE POLICY "Owners can manage calendar events of their own businesses"
    ON calendar_events
    FOR ALL
    USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()::text));
