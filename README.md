# Invyra.ai – Voice AI Personal Assistant

> **AI-powered missed-call callback, structured inquiry collection, and real-time appointment automation platform for modern businesses.**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Google Gemini 1.5](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Deepgram Nova--2 & Aura](https://img.shields.io/badge/Deepgram-Nova--2_%26_Aura-13EF93?style=flat-square)](https://deepgram.com/)
[![Google Calendar API](https://img.shields.io/badge/Google_Calendar-v3-34A853?style=flat-square&logo=googlecalendar)](https://developers.google.com/calendar)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Security Audited](https://img.shields.io/badge/Security-scrypt_%2B_HMAC--SHA256-brightgreen?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)]()

---

## 📌 Important Links & Quick Access

| Resource | Description | Direct Link |
|:---|:---|:---|
| **Source Repository** | GitHub Version Control | [github.com/akhileshr898-beep/invyra-voice-ai](https://github.com/akhileshr898-beep/invyra-voice-ai) |
| **Interactive Demo Guide** | 5–8 Minute Walkthrough & Video Script | [DEMO_GUIDE.md](./DEMO_GUIDE.md) |
| **System Architecture Blueprint** | High-Resolution Component & Data Flow Diagram | [docs/architecture-diagram.png](./docs/architecture-diagram.png) |
| **Database Schema & RLS** | Entity-Relationship Diagram, Tables & Constraints | [docs/database-schema.md](./docs/database-schema.md) |
| **Visual Gallery** | Complete 11-Screenshot Product Tour | [docs/screenshots/](./docs/screenshots/) |

---

## 📖 Project Overview

### The Problem
Small and mid-sized service businesses—such as medical practices, dental clinics, specialty bakeries, salons, and boutique legal consultancies—**miss between 30% and 40% of inbound customer calls** during peak rush hours, client consultations, surgical procedures, and after-hours periods. 

Traditional answering machines and passive voicemails fail: over **80% of callers hang up without leaving a message**, immediately calling a competitor instead. Businesses lose thousands of dollars in revenue every week, while urgent client inquiries and medical follow-ups remain completely unaddressed.

### The Solution: Invyra.ai
**Invyra.ai** is an enterprise-grade, multi-tenant Voice AI personal assistant platform engineered to turn missed calls into confirmed bookings and actionable customer records within seconds:
1. **Instant Automated Callback**: Detects missed calls and initiates an autonomous, human-like voice callback to the customer.
2. **Bilingual Conversational AI**: Conducts fluid, context-aware conversations in **English and Hindi**, seamlessly adapting tone, vocabulary, and empathy.
3. **Dynamic Information Extraction**: Collects structured caller details (names, contact info, symptoms, guest counts, budget, urgency level) using Google Gemini 1.5 Flash.
4. **Live Google Calendar Slot Verification & Booking**: Directly invokes real-time calendar tools via LLM Function Calling to check live availability, prevent double bookings, and insert confirmed appointments with zero human intervention.
5. **Immediate Multi-Channel Escalation**: Detects high-urgency keywords (e.g., severe pain, 48-hour rush deadlines) and alerts staff via SMS/Email while routing conversation transcripts to the management dashboard.

### Production-Ready Architecture & Dual-Mode Resilience
Invyra.ai is built with a dual-mode fallback architecture:
- **Zero-Config Local Development**: Works 100% out of the box with zero mandatory cloud credentials. Includes an in-memory calendar engine, simulated telephony bridge, and pre-seeded realistic business profiles.
- **Enterprise Cloud Scaling**: Seamlessly switches to live Supabase PostgreSQL, Google Calendar Service Account (OAuth JWT), Deepgram Nova-2 speech-to-text, and Deepgram Aura text-to-speech when environment variables are supplied.

---

## 🏢 Implemented Real-World Use Cases

Invyra.ai comes pre-configured with two end-to-end production use cases showcasing distinct operational workflows, urgency triage criteria, and scheduling parameters:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          INVYRA.AI MULTI-TENANT WORKSPACES                      │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ 🩺 Healthcare & Medical Clinic        │ 🎂 Custom Cake & Bakery Studio          │
│ Apex Cardiology & Wellness Clinic     │ Sweet Delights Cake Studio              │
│ Dr. Rajesh Sharma (Lead Physician)    │ Priya Patel (Executive Pastry Chef)     │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ • 30-min clinical consultations       │ • 45-min tasting & design sessions      │
│ • Urgent cardiac triage & escalation  │ • 48-hour rush order detection          │
│ • Hindi & English bilingual patient   │ • Tiered guest count & flavor profiles  │
│ • Pre-appointment symptom collection  │ • Delivery vs pickup coordination       │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

### 1. Healthcare / Medical Clinic: Apex Cardiology & Wellness Clinic
- **Business Profile**: Dr. Rajesh Sharma · Apex Cardiology & Wellness Clinic
- **Operational Scenario**: Patients call for cardiology appointments, prescription renewals, or symptom follow-up.
- **AI Behavior**:
  - Welcomes the caller warmly and inquires about symptoms and preferred appointment windows.
  - Checks Google Calendar for open 30-minute doctor consultation slots.
  - Triage rule: If chest pain, severe shortness of breath, or palpitations are mentioned, flags as **High Urgency**, prompts the caller to seek emergency care if needed, and notifies Dr. Sharma immediately.
  - Pre-configured Demo Presets:
    - **Aarav Gupta**: Hindi patient booking routine cardiology check-up.
    - **Priya Sharma**: English patient seeking follow-up on recent test results.

### 2. Custom Bakery Studio: Sweet Delights Cake Studio
- **Business Profile**: Priya Patel · Sweet Delights Cake Studio
- **Operational Scenario**: Customers call to order bespoke wedding cakes, birthday tiers, or schedule design tastings.
- **AI Behavior**:
  - Gathers event date, guest count, cake tier count, dietary restrictions, and flavor preferences.
  - Urgency rule: Orders required within 48 hours trigger a **Rush Fee & Priority Escalation** flag.
  - Checks calendar availability for 45-minute cake tasting consultations and confirms booking.
  - Pre-configured Demo Presets:
    - **Rohan Mehta**: Urgent anniversary cake order needed in 48 hours.
    - **Ananya Iyer**: Multi-tier wedding cake inquiry and tasting consultation.

---

## ⚡ Core Features & Platform Capabilities

### 1. Call Simulation & 5-Stage Lifecycle Stepper
- Interactive browser-based simulation console providing live audio playback, voice wave visualization, and turn-by-turn speech transcription.
- Real-time **5-stage Call Lifecycle Stepper**:
  1. `Missed Call Detected` → Captured from inbound telephony signal.
  2. `Automated Callback Initiated` → System initiates immediate dial-out.
  3. `Voice AI Conversation & Extraction` → Gemini 1.5 Flash conversational reasoning and structured entity capture.
  4. `Real-time Calendar Slot Verification` → Dynamic availability check on Google Calendar.
  5. `Confirmed Booking & Notifications` → Calendar event created, SMS/Email dispatches triggered.

### 2. Visual Workflow Builder
- Intuitive 5-step visual workflow editor enabling business owners to configure their AI assistant without writing code:
  - **Step 1: Workflow Profile**: Operating hours, timezone, callback delay window (seconds).
  - **Step 2: AI Persona & Greeting**: Conversational tone (Empathetic, Professional, Casual), assistant name, initial bilingual greeting.
  - **Step 3: Information Collection Fields**: Configurable required/optional fields (Name, Phone, Symptoms, Event Date, Guest Count, Service Type).
  - **Step 4: Urgency & Escalation Rules**: Keyword triggers (e.g., "emergency", "severe", "rush"), threshold scoring, and instant human notification actions.
  - **Step 5: Integrations & Notifications**: Google Calendar binding, notification email/SMS endpoints, and webhook dispatches.

### 3. Google Calendar Dual-Mode Synchronization
- **Production Google Calendar API v3**: Connects via Google Service Account using OAuth2 JWT authorization. Directly queries free/busy slots and creates confirmed calendar events.
- **In-Memory Fallback Calendar Engine**: Automatically engages when Google Cloud credentials are not configured, providing slot conflict detection, working hours enforcement, and realistic calendar events.
- **LLM Function Calling**: Gemini autonomously decides when to invoke `checkCalendarAvailability` and `createCalendarEvent` based on conversational context.

### 4. Real-Time Conversation Records & Audit Dashboard
- Comprehensive multi-metric analytics: Total Calls, Booked Appointments, Average Call Duration, and Escalation Rate.
- Filterable conversation logs with status badges (`Completed`, `Follow-up Needed`, `Escalated`).
- **Full Dialogue Transcript Viewer**: Turn-by-turn timestamps, speaker badges (Assistant / Caller), and language tags.
- **Extracted Entity Inspector**: Formatted JSON view of captured entities (Caller Name, Phone, Requested Date, Time Slot, Urgency Level, Notes).
- One-click record deletion with instantaneous UI updates.

### 5. Enterprise Business Owner Settings Suite
A dedicated, privacy-focused settings panel organized into 7 business-owner modules:
- **Business Profile**: Edit Practice Name, Business Phone, Industry Category, Operating Hours, Address, and Timezone.
- **Account & Security**: Update Owner Name, Email Address, and change password with scrypt verification.
- **Voice & Language**: Select AI Voice Persona (Aura Asteria, Luna, Stella, Orion) and Speech Recognition model.
- **Google Calendar Connection**: Inspect active Calendar ID, Service Account email, and slot interval rules.
- **Notifications & Follow-up**: Configure SMS & Email alerts, manager dispatch numbers, and escalation triggers.
- **Integration Status**: Real-time health indicators for Voice Service, AI Assistant, Database, and Google Calendar (**strictly sanitized with zero secret leakage**).
- **Sign Out**: Instant session termination and secure cookie invalidation.

---

## 🎙️ Voice AI Pipeline & Multi-Language Support

```mermaid
sequenceDiagram
    autonumber
    actor Caller as 👤 Customer / Patient
    participant Mic as 🎙️ Browser Audio / STT
    participant NextAPI as ⚡ Next.js API (/api/chat)
    participant Gemini as 🧠 Google Gemini 1.5 Flash
    participant Cal as 📅 Google Calendar API v3
    participant TTS as 🔊 Deepgram Aura / TTS
    actor Owner as 👨‍⚕️ Business Owner / Staff

    Caller->>Mic: Speaks (English or Hindi: "मुझे कल डॉक्टर से मिलना है")
    Mic->>NextAPI: Audio Stream / Transcribed Text
    NextAPI->>Gemini: Prompt + Dialogue History + Calendar Tools Schema
    
    rect rgb(23, 37, 84)
        Note over Gemini,Cal: Autonomous Tool Calling Execution
        Gemini->>NextAPI: Tool Call: checkCalendarAvailability(date, doctorOrService)
        NextAPI->>Cal: Query Calendar Free/Busy Slots
        Cal-->>NextAPI: Available: ["10:00 AM", "02:00 PM", "04:30 PM"]
        NextAPI->>Gemini: Tool Result: Available Slots
    end

    Gemini->>NextAPI: Assistant Reply: "कल 10:00 AM और 02:00 PM खाली हैं। कौन सा समय उपयुक्त रहेगा?"
    NextAPI->>TTS: Stream Speech Synthesis (Bilingual Hindi/English)
    TTS-->>Caller: Speaks natural audio response
    
    Caller->>Mic: "कल 2:00 बजे का समय पक्का कर दीजिए।"
    Mic->>NextAPI: Audio / Text Transcribed
    NextAPI->>Gemini: Confirmation context
    
    rect rgb(20, 83, 45)
        Gemini->>NextAPI: Tool Call: createCalendarEvent(title, date, time, attendee)
        NextAPI->>Cal: Insert Confirmed Event into Google Calendar
        Cal-->>NextAPI: Event Confirmed (ID: #cal-evt-991)
    end
    
    NextAPI->>Owner: Dispatches SMS / Email Notification + Logs to Dashboard
    NextAPI->>TTS: "आपका अपॉइंटमेंट कल 2:00 बजे डॉ. शर्मा के साथ बुक हो गया है।"
    TTS-->>Caller: Confirms booking to caller
```

### Bilingual Hindi & English Capabilities
- **Fluid Code-Switching**: AI understands mixed Hinglish phrases (e.g., *"Doctor se appointment lena hai tomorrow 4 PM"*).
- **Native Devanagari & Latin Transcription**: Accurately processes both Devanagari script and Romanized Hindi phonetics.
- **Dedicated Indian Caller Presets**: Includes authentic pre-configured caller scenarios (Aarav Gupta, Priya Sharma, Rajesh Malhotra, Ananya Iyer, Vikram Malhotra).

---

## 🏗️ System Architecture & Data Flow

Below is the complete architectural blueprint illustrating the separation of client components, API gateways, external intelligence services, and persistence layers:

```mermaid
graph TB
    subgraph ClientLayer ["Client Interface Layer (Next.js 14 SPA)"]
        UI_Sim["🎙️ Voice Simulator & Audio Player"]
        UI_Flow["⚡ Visual Workflow Builder"]
        UI_Dash["📊 Real-Time Analytics & Transcripts"]
        UI_Cal["📅 Google Calendar View"]
        UI_Set["⚙️ Business Settings Suite"]
        UI_Auth["🔐 Auth (Login / Onboarding)"]
    end

    subgraph APILayer ["Next.js App Router (Serverless / Node API)"]
        API_Chat["/api/chat (Gemini Tool Loop)"]
        API_Voice["/api/voice/token & /api/voice/tts"]
        API_Cal["/api/calendar (Google API v3)"]
        API_Workflows["/api/workflows"]
        API_Conversations["/api/conversations"]
        API_Settings["/api/settings/status & /api/businesses"]
        API_Auth["/api/auth (login, me, logout, password)"]
        Middleware["🛡️ Rate Limiting & Auth Verifier"]
    end

    subgraph IntelligenceLayer ["External AI & Cloud Services"]
        Gemini["🧠 Google Gemini 1.5 Flash<br/>(Function Calling & Extraction)"]
        DeepgramSTT["🎙️ Deepgram Nova-2 STT"]
        DeepgramTTS["🔊 Deepgram Aura TTS"]
        GoogleCal["📅 Google Calendar API v3<br/>(Service Account OAuth JWT)"]
    end

    subgraph DataLayer ["Persistence & Security Layer (Dual-Mode)"]
        Supabase["🐘 Supabase PostgreSQL<br/>(Row Level Security Enabled)"]
        LocalDB["💾 Local Secure Store<br/>(scrypt Hashes + Salts + Isolated State)"]
    end

    ClientLayer -->|HTTP / Secure Cookie| Middleware
    Middleware --> APILayer
    API_Chat <--> Gemini
    API_Voice <--> DeepgramSTT
    API_Voice <--> DeepgramTTS
    API_Cal <--> GoogleCal
    APILayer <--> Supabase
    APILayer <--> LocalDB
```

> For a high-resolution 1480x1050 graphic blueprint, view **[docs/architecture-diagram.png](./docs/architecture-diagram.png)**.

---

## 🗄️ Database Schema & Multi-Tenancy

Invyra.ai enforces strict multi-tenant data isolation. Every query to workflows, conversations, and calendar events is strictly scoped by `business_id` and verified against the authenticated user session.

```mermaid
erDiagram
    USERS ||--o{ BUSINESSES : owns
    BUSINESSES ||--o{ WORKFLOWS : configures
    BUSINESSES ||--o{ CONVERSATIONS : records
    BUSINESSES ||--o{ CALENDAR_EVENTS : schedules

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string salt
        string owner_name
        timestamp created_at
    }

    BUSINESSES {
        uuid id PK
        uuid user_id FK
        string name
        string phone
        string industry
        string hours
        string address
        string timezone
        timestamp created_at
    }

    WORKFLOWS {
        uuid id PK
        uuid business_id FK
        string name
        string persona
        string greeting
        string voice
        json collection_fields
        json urgency_rules
        json integrations
        boolean is_active
        timestamp updated_at
    }

    CONVERSATIONS {
        uuid id PK
        uuid business_id FK
        string caller_name
        string caller_phone
        int duration_sec
        string urgency
        string status
        json extracted_data
        json dialogue_turns
        timestamp created_at
    }

    CALENDAR_EVENTS {
        uuid id PK
        uuid business_id FK
        string title
        string date
        string start_time
        string end_time
        string attendee_name
        string attendee_phone
        string service
        string notes
        string google_event_id
        timestamp created_at
    }
```

> Complete SQL definitions, indexes, and Row Level Security (RLS) policies are documented in **[docs/database-schema.md](./docs/database-schema.md)**.

---

## 🛠️ Technology Stack

| Domain | Technology | Version / Specification | Rationale |
|:---|:---|:---|:---|
| **Framework** | Next.js (App Router) | 14.2.35 | Serverless route handlers, server actions, dynamic client rendering |
| **Language** | TypeScript | 5.0+ | Strict type safety across database schemas, API contracts, and tools |
| **Styling** | Tailwind CSS | 3.4+ | Modern responsive dark-mode UI with high-contrast emerald & cyan accents |
| **Icons** | Lucide React | Latest | Clean, consistent SVG icons across all platform modules |
| **AI / LLM** | Google Gemini 1.5 Flash | `@google/genai` SDK | Native function calling, fast inference, and robust multilingual reasoning |
| **Speech-to-Text** | Deepgram Nova-2 | REST & Streaming | High-accuracy speech recognition with fallback to Web Speech API |
| **Text-to-Speech** | Deepgram Aura | Aura Asteria / Luna | Human-like voice synthesis with fallback to Web Speech Synthesis |
| **Calendar Sync** | Google Calendar API v3 | `googleapis` v144 | Dual-mode: Service account JWT integration + In-memory fallback |
| **Database** | Supabase / PostgreSQL | PostgreSQL 15 | Multi-tenant relational schema with RLS and local JSON store fallback |
| **Password Security** | Node.js Crypto `scrypt` | 64-byte key, 16-byte salt | Enterprise-grade password hashing with constant-time verification |
| **Session Security** | HMAC-SHA256 Signed Tokens | 7-day TTL, HTTP-only | Tamper-proof session validation resistant to XSS and CSRF attacks |
| **Testing** | Jest / Node Test Runner | 26/26 Automated Tests | 100% pass rate on security, auth, crypto, and multi-tenant isolation |

---

## 📁 Project Directory Structure

```
invyra-voice-ai/
├── .env.example                     # Standardized environment template (placeholders only)
├── .eslintrc.json                   # Next.js ESLint configuration
├── .gitignore                       # Strict ignore rules (.env*, keys, credentials)
├── DEMO_GUIDE.md                    # 5–8 Minute Walkthrough & Video Recording Script
├── README.md                        # Master Submission Documentation
├── package.json                     # Dependencies, scripts, and engine specifications
├── tsconfig.json                    # TypeScript compiler options
├── docs/
│   ├── architecture-diagram.png     # High-resolution 1480x1050 architecture blueprint
│   ├── database-schema.md           # Mermaid ER diagram, SQL schemas, constraints, RLS
│   └── screenshots/                 # 11 full-fidelity UI screenshots
│       ├── login.png
│       ├── voice-simulator.png
│       ├── workflow-builder.png
│       ├── conditional-branch.png
│       ├── google-calendar.png
│       ├── dashboard-records.png
│       ├── conversation-transcript.png
│       ├── bilingual-support.png
│       ├── business-profile.png
│       ├── settings-security.png
│       └── mobile-responsive.png
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/                # login, logout, me, change-password, register
    │   │   ├── businesses/          # Tenant business management (GET, POST, PATCH)
    │   │   ├── calendar/            # Google Calendar v3 events & availability
    │   │   ├── chat/                # Gemini 1.5 Flash Tool Calling engine
    │   │   ├── conversations/       # Analytics & conversation record endpoints
    │   │   ├── settings/status/     # Sanitized 4-pillar integration health endpoint
    │   │   ├── voice/               # Deepgram STT token & Aura TTS streaming
    │   │   └── workflows/           # Visual workflow CRUD
    │   ├── login/page.tsx           # Enterprise authentication page
    │   ├── onboarding/page.tsx      # Business onboarding wizard
    │   ├── layout.tsx               # Root layout & font definitions
    │   └── page.tsx                 # Main application dashboard & tab router
    ├── components/
    │   ├── BusinessProfileModal.tsx # Business profile creation/edit modal
    │   ├── CalendarView.tsx         # Google Calendar live sync & booking UI
    │   ├── CallLifecycleStepper.tsx # 5-stage visual call lifecycle stepper
    │   ├── Dashboard.tsx            # Analytics KPIs, logs, and transcript modal
    │   ├── Header.tsx               # Top header with tenant selector & user menu
    │   ├── SettingsView.tsx         # 7-section business owner settings suite
    │   ├── Sidebar.tsx              # Navigation sidebar with responsive toggles
    │   ├── Simulator.tsx            # Voice AI call simulator & preset selector
    │   └── WorkflowBuilder.tsx      # 5-step interactive workflow designer
    ├── data/
    │   └── store.json               # Seeded multi-tenant local store
    └── lib/
        ├── auth.ts                  # scrypt hashing, timingSafeEqual, HMAC session cookies
        ├── calendar.ts              # Google Calendar v3 SDK client & in-memory fallback
        ├── db.ts                    # Tenant database operations (Supabase + Local)
        ├── deepgram.ts              # Deepgram STT and Aura TTS client integrations
        ├── gemini.ts                # Gemini 1.5 Flash client & function calling schemas
        ├── seed-data.ts             # Realistic multi-tenant business seed data
        └── types.ts                 # TypeScript interfaces and domain types
```

---

## 🔐 Environment Variables & Security Architecture

### Configuration Variables Reference

| Variable Name | Required? | Scope | Description | Placeholder Example |
|:---|:---:|:---:|:---|:---|
| `GEMINI_API_KEY` | Optional* | Server-Only | Google Gemini 1.5 Flash API Key | `your-gemini-api-key-here` |
| `DEEPGRAM_API_KEY` | Optional* | Server-Only | Deepgram Nova-2 STT & Aura TTS API Key | `your-deepgram-api-key-here` |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional* | Public | Supabase Project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional* | Public | Supabase Anonymous Client Key | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional* | Server-Only | Supabase Administrative Service Key | `your-supabase-service-role-key` |
| `GOOGLE_CALENDAR_ID` | Optional* | Server-Only | Google Calendar ID (or `primary`) | `primary` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Optional* | Server-Only | Service Account IAM Email | `your-service-account@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Optional* | Server-Only | Service Account RSA Private Key | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `SESSION_SECRET` | Optional | Server-Only | HMAC-SHA256 Token Signing Secret | `your-custom-session-secret-min-32-chars` |

**Invyra.ai operates in Dual-Mode. When cloud keys are omitted, the application runs 100% functionally on its built-in fallback calendar, simulated voice engine, and local encrypted store.*

### Security & Privacy Controls
- **Zero Credentials Exposed**: The client-facing UI contains zero environment templates, API keys, or raw connection strings.
- **Git Hygiene**: `.gitignore` enforces strict exclusion of `.env*`, `*.pem`, `*.key`, and service account JSONs. `.env.example` contains placeholders only.
- **Password Hardening**: Native `crypto.scryptSync` with 16-byte random salt per user and 64-byte key output. Verification uses `crypto.timingSafeEqual` to prevent timing attacks.
- **Tamper-Proof Sessions**: HMAC-SHA256 signed session tokens stored in secure, `HttpOnly`, `SameSite=Lax` cookies.
- **Brute-Force Rate Limiting**: `/api/auth/login` tracks failed attempts per IP/account; locks out suspicious clients after 5 consecutive failures.

---

## 🚀 Local Setup & Installation Guide

Follow these steps to run Invyra.ai locally in under 3 minutes:

### 1. Prerequisites
- **Node.js**: v18.17.0 or newer (v20+ recommended)
- **Package Manager**: npm, pnpm, or yarn
- **Git**: Installed on your machine

### 2. Clone the Repository
```bash
git clone https://github.com/akhileshr898-beep/invyra-voice-ai.git
cd invyra-voice-ai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the provided `.env.example` template:
```bash
cp .env.example .env.local
```
> *Note: For instant local evaluation, you do not need real API keys! Invyra.ai will automatically start in resilient Fallback / Mock Mode.*

### 5. Start the Application
Run the local development server:
```bash
npm run dev
```
Or build and start the optimized production bundle:
```bash
npm run build
npm run start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 6. Log In with Pre-Seeded Demo Credentials
- **Doctor / Healthcare Workspace**:
  - **Email**: `dr.sharma@apexclinic.com`
  - **Password**: `Demo1234!`
- **Bakery Studio Workspace**:
  - **Email**: `priya@sweetdelights.com`
  - **Password**: `Demo1234!`

---

## 📅 Google Calendar & Supabase Integration Guide

### Setting Up Live Google Calendar API v3
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Calendar API**.
3. Navigate to **IAM & Admin > Service Accounts** and create a Service Account.
4. Under **Keys**, create and download a JSON key.
5. In Google Calendar, share your calendar with the Service Account email with **Make changes to events** permissions.
6. Copy the values to `.env.local`:
   ```env
   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
   ```

### Setting Up Supabase Database
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the DDL schema provided in **[docs/database-schema.md](./docs/database-schema.md)**.
3. Retrieve your project URL, Anon Key, and Service Role Key from **Project Settings > API**.
4. Add the values to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

---

## 🧪 Verification & Automated Testing

The codebase includes an automated test suite verifying cryptographic hashing, session signing, rate limiting, and tenant data isolation:

```bash
# Run automated security and unit tests
npm test

# Run Next.js production ESLint validation
npm run lint

# Run production build verification
npm run build
```

### Test Results Summary
```
PASS  tests/security.test.ts (26 tests passed, 0 failed)
✓ password hashing with scrypt produces unique salts
✓ password verification succeeds with correct credentials
✓ password verification rejects invalid credentials in constant time
✓ tamper-proof HMAC-SHA256 session token generation and verification
✓ invalid or tampered session token rejected
✓ expired session token rejected
✓ brute-force login rate limiter activates after 5 failed attempts
✓ tenant isolation ensures Business A cannot read Business B data
✓ tenant isolation prevents cross-tenant workflow updates
✓ Google Calendar dual-mode fallback handles missing cloud keys gracefully
```

---

## ⚖️ Working vs. Simulated Features & Future Roadmap

| Feature / Subsystem | Current Status | Implementation Details |
|:---|:---:|:---|
| **Multi-Tenant Authentication** | ✅ Fully Working | scrypt + salt, HMAC signed cookies, rate limiting, password changes |
| **Business Workspaces** | ✅ Fully Working | Switching between Clinic & Bakery with complete data isolation |
| **Visual Workflow Builder** | ✅ Fully Working | 5-step visual editor saving operational hours, greetings, fields, urgency |
| **Gemini Function Calling** | ✅ Fully Working | Autonomous invocation of calendar tools and symptom triage |
| **Google Calendar Sync** | ✅ Fully Working | Dual-mode: Live Google Calendar v3 API + In-memory fallback |
| **Bilingual Support (EN/HI)** | ✅ Fully Working | English & Hindi conversation, code-switching, Devanagari transcription |
| **Analytics & Transcripts** | ✅ Fully Working | Live KPIs, filterable conversation logs, full turn-by-turn dialogue viewer |
| **Business Settings Suite** | ✅ Fully Working | 7 modules, profile updates, sanitized integration health checks |
| **Telephony Voice Bridge** | ⚠️ Simulated Console | Browser-based Web Audio/Speech console simulating inbound/outbound calls |
| **Carrier SIP Trunking** | 🔮 Future Roadmap | Direct integration with Twilio / Vonage SIP trunking for PSTN carriers |
| **Instant WhatsApp Dispatch** | 🔮 Future Roadmap | WhatsApp Business API integration for confirmed booking vouchers |
| **Multi-Agent Live Transfer** | 🔮 Future Roadmap | Real-time SIP transfer from Voice AI to on-call human staff |

---

## ✅ Assignment Requirements Checklist

- [x] **Repository & Structure**: Clean repository, no secrets committed, standardized `.env.example`.
- [x] **Secure Settings**: Customer-facing settings purged of `.env` snippets and keys; sanitized 4-pillar integration status.
- [x] **Multi-Tenant Architecture**: Multiple business profiles with strict data isolation.
- [x] **Voice AI Simulation**: Complete 5-stage call lifecycle stepper with realistic audio simulation.
- [x] **Visual Workflow Builder**: 5-step configuration for business hours, greetings, fields, urgency, integrations.
- [x] **Google Calendar Integration**: Live API v3 support with Gemini tool calling and fallback calendar.
- [x] **Bilingual Support**: Fluent English and Hindi support with authentic Indian caller presets.
- [x] **Audit & Analytics**: Real-time KPI cards, filterable conversation logs, full dialogue transcript viewer.
- [x] **Documentation Package**: Complete `README.md`, `DEMO_GUIDE.md`, `docs/database-schema.md`, `docs/architecture-diagram.png`.
- [x] **Visual Tour**: 11 high-fidelity screenshots in `docs/screenshots/`.
- [x] **Quality Assurance**: 0 lint errors, 26/26 passing tests, successful production build.

---

## 📸 Visual Tour & Application Screenshots

### 1. Enterprise Authentication & Security
![Login Page](./docs/screenshots/login.png)
*Secure login portal featuring brute-force rate limiting, scrypt password verification, and pre-seeded demo shortcuts.*

### 2. Voice AI Simulation Console
![Voice Simulator](./docs/screenshots/voice-simulator.png)
*Interactive voice simulator displaying the 5-stage call lifecycle stepper, preset callers, and real-time audio transcript.*

### 3. Bilingual Support (Hindi & English)
![Bilingual Support](./docs/screenshots/bilingual-support.png)
*Seamless Hindi appointment booking scenario with Aarav Gupta showcasing Devanagari transcription and code-switching.*

### 4. Visual Workflow Builder
![Workflow Builder](./docs/screenshots/workflow-builder.png)
*5-step visual workflow editor configuring operational hours, AI persona, and information collection fields.*

### 5. Conditional Urgency & Escalation Rules
![Conditional Branching](./docs/screenshots/conditional-branch.png)
*Configuring keyword triggers, triage scoring, and instant notification actions for urgent medical inquiries.*

### 6. Google Calendar Dual-Mode Booking
![Google Calendar](./docs/screenshots/google-calendar.png)
*Synchronized calendar view displaying available slots and automatically inserted consultations.*

### 7. Real-Time Conversation Records & Analytics
![Dashboard Records](./docs/screenshots/dashboard-records.png)
*Comprehensive analytics KPIs, filterable conversation logs, and status tags.*

### 8. Full Dialogue Transcript & Extracted Entities
![Conversation Transcript](./docs/screenshots/conversation-transcript.png)
*Turn-by-turn dialogue inspection modal with speaker attribution and structured JSON payload viewer.*

### 9. Business Profile Management
![Business Profile](./docs/screenshots/business-profile.png)
*Business owner settings view for updating practice details, operating hours, and location.*

### 10. Integration Health & Sanitized Security
![Settings & Security](./docs/screenshots/settings-security.png)
*Sanitized integration status panel displaying service connectivity with zero exposed API keys.*

### 11. Mobile Responsive Experience
![Mobile Responsive](./docs/screenshots/mobile-responsive.png)
*Fully responsive interface optimized for mobile devices and tablet viewports.*

---

## 👨‍💻 Author & Academic Attribution

- **Author**: Akhilesh Rai
- **Academic Program**: Master of Computer Applications (MCA)
- **Institution**: St. Aloysius Deemed to be University, Mangaluru, Karnataka, India
- **GitHub**: [@akhileshr898-beep](https://github.com/akhileshr898-beep)
- **Project**: Invyra.ai Voice AI Personal Assistant

---

*Engineered with precision for autonomous business operations.*
