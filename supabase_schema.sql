-- ==========================================================
-- AI-Powered Voice Assistant & Medical Booking Database Schema
-- Compatible with Supabase (PostgreSQL)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    phone TEXT NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    operating_hours TEXT DEFAULT 'Mon-Sat 9:00 AM - 7:00 PM',
    tone TEXT DEFAULT 'Professional, empathetic, and efficient',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger TEXT DEFAULT 'missed_call',
    greeting TEXT NOT NULL,
    fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    conditional_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_after_collection TEXT NOT NULL DEFAULT 'create_calendar_event',
    closing_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customer Conversations & Missed-Call Records
CREATE TABLE IF NOT EXISTS customer_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
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

-- 4. Calendar Events (Appointments & Callbacks)
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES customer_conversations(id) ON DELETE SET NULL,
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

-- Create indexes for rapid dashboard querying
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON customer_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_follow_up ON customer_conversations(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON customer_conversations(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_start_time ON calendar_events(start_time ASC);
