# 🏥 Invyra Voice AI – AI-Powered Medical Appointment Booking & Multi-Industry Voice Assistant

A production-grade, responsive, mobile-first web application enabling small business owners (Clinics, Bakeries, Delivery Services, Real Estate, and Repair Services) to automate missed-call handling and customer follow-ups using an intelligent Voice AI personal assistant with **Gemini Tool Calling**, **Deepgram Voice (Nova-2 STT & Aura TTS)**, **Google Calendar Integration**, and **Supabase Data Persistence**.

---

## 🏗️ Architecture Diagram

```mermaid
flowchart TD
    subgraph Client [Mobile-First Next.js Web App]
        NAV[Navigation & Business Selector]
        WB[Custom Workflow Builder 5-Step]
        SIM[Voice / Text Call Simulator]
        DASH[Dashboard & Customer Records]
        CAL[Google Calendar Schedule Agenda]
        MIC[MediaRecorder Audio Capture]
        AUDIO[HTML5 Audio Player]
    end

    subgraph Serverless [Next.js Serverless Route Handlers]
        STT_API["/api/voice/stt (Deepgram Nova-2 STT)"]
        TTS_API["/api/voice/tts (Deepgram Aura TTS)"]
        CHAT_API["/api/chat (Gemini AI + Tool Calling)"]
        CAL_API["/api/calendar (Google Calendar Client)"]
        TRACK_API["/api/tools/tracking (Bonus External Tool API)"]
        WF_API["/api/workflows (Workflow CRUD)"]
        CONV_API["/api/conversations (Customer Records CRUD)"]
    end

    subgraph Cloud_Services [External Cloud Services]
        DG_STT[Deepgram Nova-2 Speech-to-Text]
        DG_TTS[Deepgram Aura Text-to-Speech]
        GEMINI[Google Gemini 1.5 Flash LLM]
        GCAL[Google Calendar API v3]
        SUPABASE[(Supabase PostgreSQL Database)]
    end

    %% Voice Pipeline Strictly Zero Browser Speech APIs
    MIC -->|Raw Audio Blob| STT_API -->|Nova-2 Streaming| DG_STT
    STT_API -->|Transcribed Text EN/HI| SIM
    SIM -->|Conversation Turn| CHAT_API
    CHAT_API -->|Prompts & Tool Schemas| GEMINI

    %% Autonomous Tool Calling Pipeline
    GEMINI -->|checkCalendarAvailability / createCalendarEvent / reschedule / cancel| CAL_API --> GCAL
    GEMINI -->|lookupOrderOrCustomer| TRACK_API
    CHAT_API -->|AI Response Text| SIM

    SIM -->|Synthesize Speech| TTS_API -->|Aura Neural Voice| DG_TTS
    TTS_API -->|MP3 Audio Stream| AUDIO

    %% Persistence
    CHAT_API -->|Structured Record & AI Summary| CONV_API --> SUPABASE
    WB -->|Workflow Definitions & Urgency Rules| WF_API --> SUPABASE
    DASH -->|Fetch & Update Follow-up Status| CONV_API
    CAL -->|Fetch Events| CAL_API
```

---

## 🌟 Key Features & Requirements Compliance

### 1. Multi-Industry Support (Generic Core)
The product is generic enough to support any industry without rewriting core code:
- **🏥 Clinic / Doctor (Complete Use Case #1)**:
  - Handles appointment booking, rescheduling, and cancellations.
  - Asks for patient name, preferred doctor/specialty, date, and time.
  - Checks Google Calendar availability in real-time.
  - **Medical Safety Constraint**: Strictly avoids offering medical diagnoses or prescribing drugs; prompts emergency dial 911/112 for severe chest pain or acute symptoms.
- **🎂 Cake Shop / Bakery (Complete Use Case #2)**:
  - Asks whether customer wants a custom cake or has a general inquiry.
  - Collects occasion, cake flavor, weight (kg), required date, custom inscription, fulfillment (delivery vs pickup), and budget.
  - **Conditional Logic**: If cake is required within 24 hours &rarr; automatically flags order as **URGENT** for kitchen priority.
- **🚚 Delivery / Logistics & 🏡 Real Estate**:
  - Pre-seeded templates ready for package tracking and site visit lead generation.

### 2. Custom Workflow Builder (5-Step Configurator)
A clean, step-by-step visual builder allowing owners to configure:
1. **Workflow Name & Missed-Call Trigger**
2. **Greeting & Assistant Personality** (Tone, bilingual behavior)
3. **Questions / Data Fields to Collect** (Field label, key, type, required vs optional toggle, spoken AI prompt question)
4. **Conditional Urgency Logic** (e.g. If `required_date` &le; 24 hours &rarr; mark priority as Urgent)
5. **Post-Collection Actions & Closing** (Google Calendar Event creation, Order Enquiry, Spoken closing message, Follow-up status)

### 3. Voice AI Conversation Experience (**Strictly No Browser Speech APIs**)
- **Audio Capture**: Captures microphone audio using `navigator.mediaDevices.getUserMedia` & `MediaRecorder`.
- **Speech-to-Text (STT)**: Sent to `/api/voice/stt` powered by **Deepgram Nova-2** (with multilingual English & Hindi support).
- **Text-to-Speech (TTS)**: Sent to `/api/voice/tts` powered by **Deepgram Aura** (`aura-asteria-en`) streaming MP3 audio directly to an HTML5 Audio Player.
- **Visual Waveform & Equalizer**: Live animated wave bars indicating speaking, listening, and reasoning states.
- **Hybrid Text Mode**: Full interactive text chat console with prompt suggestion chips for silent testing.

### 4. Autonomous Gemini AI Tool Calling & Google Calendar Integration
Gemini autonomously decides when to trigger external tools based on customer intent:
- `checkCalendarAvailability`: Checks if a requested slot is free on Google Calendar.
- `createCalendarEvent`: Automatically books the confirmed appointment with attendee name, phone, doctor, and notes.
- `rescheduleCalendarEvent`: Moves an existing booking to a new date/time.
- `cancelCalendarEvent`: Deletes/cancels an appointment with logged reason.
- **Bonus External API Tool** (`lookupOrderOrCustomer`): Dynamic order status and courier delivery tracking lookup.
- **Live Tool Inspector**: Displays real-time inspection cards in the UI showing tool arguments and execution responses.

### 5. Multilingual Support (English & Hindi)
- Native conversational capability in **English** and **हिन्दी (Hindi / Hinglish)**.
- Automatic language detection with natural switching in prompt instructions.

### 6. Dashboard & Customer Records
Displays every required field:
- Caller Name and Phone Number
- Business and Workflow Used
- Date and Time
- Conversation Status (`completed`, `in_progress`, `abandoned`)
- Customer Intent
- Structured Information Collected (rendered as clean badges & key-value pairs)
- AI-Generated Summary
- Action Performed (e.g., "Google Calendar Event Created: Tomorrow at 4 PM")
- Urgency / Priority badge (Urgent with pulsing alert, High, Normal)
- **Interactive Follow-up Status**: Owners can mark records as **Pending**, **Contacted**, **Completed**, or **Closed** with 1 click.
- **Full Conversation Transcript**: Complete dialog history with timestamps, speaker labels, and tool call payloads.

---

## 🗄️ Database Schema & Data Model

The PostgreSQL schema is located in `supabase_schema.sql`:

- **`businesses`**: `id`, `name`, `industry`, `phone`, `timezone`, `operating_hours`, `tone`, `created_at`
- **`workflows`**: `id`, `business_id`, `name`, `trigger`, `greeting`, `fields_schema` (JSONB), `conditional_rules` (JSONB), `action_after_collection`, `closing_message`, `is_active`, `created_at`
- **`customer_conversations`**: `id`, `business_id`, `workflow_id`, `caller_name`, `caller_phone`, `status`, `intent`, `collected_data` (JSONB), `summary`, `action_performed`, `priority`, `follow_up_status`, `transcript` (JSONB), `language`, `created_at`, `updated_at`
- **`calendar_events`**: `id`, `conversation_id`, `title`, `start_time`, `end_time`, `attendee_name`, `attendee_phone`, `doctor_or_service`, `notes`, `google_event_id`, `status`, `created_at`

*Resilient Dual-Mode*: If live Supabase credentials are provided, data persists directly to PostgreSQL. If running out-of-the-box, the app seamlessly uses an integrated fallback store (`src/data/store.json`), guaranteeing zero 500 errors.

---

## 🚀 Quick Start & Installation Instructions

### Prerequisites
- Node.js 18+ (tested on Node.js v24.19.0)
- npm 9+

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd "Invyra AI"
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your API credentials (optional for initial review due to the built-in resilient simulation engine):
```ini
GEMINI_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_CALENDAR_ID=primary
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 3. Run Locally in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production & Verify
```bash
npm run build
npm run start
```

### 5. Deploy to Vercel
```bash
npx vercel
```
Or push to GitHub and import the repository directly in the [Vercel Dashboard](https://vercel.com). Add the environment variables under Project Settings &rarr; Environment Variables.

---

## 📋 Evaluation Note: What is Fully Working vs Simulated

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Custom Workflow Builder** | **Fully Working** | 5-step form configurator; adds/edits fields, conditions, triggers, closing messages; saves to database. |
| **Dashboard & Customer Records** | **Fully Working** | All 11 required fields displayed; interactive follow-up status toggling (`pending`, `contacted`, `completed`, `closed`); full modal transcript. |
| **Multi-Industry Profiles** | **Fully Working** | Switch between Clinic, Cake Studio, Logistics, and create new business profiles on the fly. |
| **Bilingual (English & Hindi)** | **Fully Working** | Voice & text conversations function in English, Hindi, and Hinglish with automatic language switching. |
| **Deepgram Nova-2 STT** | **Fully Working** | Serverless route `/api/voice/stt` accepts audio recordings from MediaRecorder and returns Deepgram transcripts. Strictly no browser speech APIs. |
| **Deepgram Aura TTS** | **Fully Working** | Serverless route `/api/voice/tts` streams MP3 audio back to HTML5 Audio element. |
| **Gemini AI Tool Calling** | **Fully Working** | Gemini 1.5 Flash with declared function schemas for checking, creating, rescheduling, and cancelling calendar events + bonus order lookup. |
| **Google Calendar Integration** | **Fully Working + Dual Mode** | Calls real Google Calendar API via Service Account when keys are present; synchronizes with database calendar store when testing prior to GCP setup. |
| **Emergency & Urgency Rules** | **Fully Working** | Clinic rules flag acute symptoms (chest pain &rarr; urgent); Cake Shop rules flag orders needed &le; 24 hours &rarr; urgent. |

### What is Simulated or Mocked
- If `DEEPGRAM_API_KEY` or `GEMINI_API_KEY` are not set in the environment, the app activates an intelligent deterministic simulation engine with matching tool execution responses, preventing any blank screens or runtime crashes.
- If Google Cloud Service Account credentials are not yet supplied, calendar events are saved directly to the database calendar store and displayed live in the Calendar tab.

### What to Build Next for Production
1. **Twilio / Exotel Telephony Webhook**: Connect the existing Next.js serverless STT/TTS pipeline to a real phone number SIP trunk for true live telephony missed calls.
2. **Multi-User RBAC & Auth**: Supabase Auth integration with multi-tenant organization boundaries and staff invite links.
3. **Automated WhatsApp / SMS Gateway**: Send automated WhatsApp appointment confirmations and cake order sketches immediately upon call completion.

---

## 🎥 Video Walkthrough (Loom / Screen Recording) Outline

1. **Architecture & Stack Overview (0:00 - 1:00)**: Highlight Next.js App Router, Gemini Tool Calling, Deepgram Voice (zero browser speech APIs), Google Calendar, and Supabase.
2. **Clinic Appointment Booking Demo (1:00 - 3:00)**:
   - Select Apex Care Clinic.
   - Start voice simulator callback.
   - Speak: *"I want to schedule an appointment with Dr. Sharma tomorrow at 4 PM."*
   - Show Gemini calling `checkCalendarAvailability` and `createCalendarEvent`.
   - Test in Hindi: *"नमस्ते, मुझे कल सुबह डॉक्टर से मिलना है"*.
   - Verify appointment in Google Calendar agenda tab.
3. **Cake Shop 24h Urgency Condition Demo (3:00 - 4:30)**:
   - Select Sweet Delights Cake Studio.
   - Request a 2kg Belgian chocolate cake needed today evening.
   - Demonstrate conditional rule triggering: flagged as **URGENT** priority.
4. **Custom Workflow Builder (4:30 - 6:00)**:
   - Walk through the 5 steps: Trigger &rarr; Greeting &rarr; Fields &rarr; Urgency Logic &rarr; Actions.
   - Add a custom field and save workflow.
5. **Dashboard & Status Management (6:00 - 7:00)**:
   - Review captured customer records, intent, collected data, and summary.
   - Change follow-up status from `Pending` to `Contacted` and `Completed`.
   - Open full dialogue transcript modal.
