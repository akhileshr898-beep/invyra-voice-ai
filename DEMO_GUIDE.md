# Invyra.ai – Video Demonstration Walkthrough Guide (5–8 Minutes)

> 🔗 **Loom Video Walkthrough**: [https://www.loom.com/share/invyra-voice-ai-demo](https://www.loom.com/share/invyra-voice-ai-demo) *(Record and replace with your published Loom share link)*

This demonstration guide provides an exact, structured timeline and spoken script outline for the **5–8 minute video walkthrough** (Loom / Screen Recording) of **Invyra.ai**. It demonstrates all required assignment features, real-time Gemini tool calling, Deepgram serverless voice synthesis, multi-tenant isolation, and bilingual capabilities.

---

## ⏱️ Video Demonstration Timeline

| Timestamp | Section | Key Visuals & Actions |
| :--- | :--- | :--- |
| **0:00 – 0:30** | **1. Business Problem & Solution** | Problem statement, missed-call revenue loss, Invyra.ai automated callback concept. |
| **0:30 – 1:00** | **2. Login & Multi-Tenant Data Isolation** | Login screen, authenticate as Dr. Sharma, verify Owner A vs Owner B isolation. |
| **1:00 – 2:00** | **3. Business Profile & Workflow Builder** | Settings view, 5-step Visual Workflow Studio, condition rules, and triggers. |
| **2:00 – 3:30** | **4. Clinic Missed-Call Voice Workflow** | Voice Simulator, select Priya Sharma, Deepgram Nova-2 STT & Aura TTS conversation. |
| **3:30 – 4:30** | **5. Gemini Autonomous Google Calendar Tool Calling** | Gemini decides tool call (`checkCalendarAvailability` & `createCalendarEvent`), conflict check. |
| **4:30 – 5:15** | **6. Triage Dashboard, AI Summary & Transcript** | Customer Records feed, extracted fields, clinical summary, follow-up status toggle. |
| **5:15 – 6:15** | **7. Second Use Case: Sweet Delights Cake Studio** | Switch business profile, test urgent custom cake order, conditional rush rule trigger. |
| **6:15 – 6:45** | **8. Bilingual Indian Language Support (Hindi & Hinglish)** | Select Aarav Gupta preset, speak Hindi prompt, assistant responds fluently in Hindi. |
| **6:45 – 7:20** | **9. Architecture, Database & Security** | Next.js App Router, Supabase PostgreSQL RLS, scrypt auth, server-only secret protection. |
| **7:20 – 8:00** | **10. Honest Evaluation & Production Roadmap** | What is fully live vs simulated, roadmap (Twilio telephony SIP trunk, WhatsApp gateway). |

---

## 🎙️ Section-by-Section Spoken Script & Walkthrough

### 0:00 – 0:30 | 1. Introduction: The Business Problem & Solution
* **Action on Screen**: Display the landing dashboard of Invyra.ai with the dark obsidian sidebar, vibrant blue hero banner, and soundwave branding.
* **Speaking Points**:
  > *"Every single day, medical practices and small businesses lose tens of thousands of dollars because of missed phone calls. When a patient or customer calls while receptionists are busy, 85% of callers do not leave a voicemail—they simply call a competitor.*
  >
  > *Invyra.ai solves this immediately. Our autonomous Voice AI detects the missed call, calls the patient back within seconds, conducts a natural conversational intake in English or Hindi, checks real-time doctor availability on Google Calendar, reserves the slot, and organizes structured triage records for the practice staff."*

---

### 0:30 – 1:00 | 2. Login & Multi-Tenant Data Isolation
* **Action on Screen**: Log out to show `/login`. Sign in with Dr. Sharma's credentials (`dr.sharma@apexclinic.com`).
* **Speaking Points**:
  > *"First, security and multi-tenancy are built into the core foundation. Every business owner registers with their own credentials. Passwords are encrypted with scrypt-64k and 32-byte cryptographic salts.*
  >
  > *Sessions are verified via tamper-proof HMAC-SHA256 signatures. When Dr. Sharma logs in, he accesses only his own practice—Apex Care Clinic. He can never see patient records, workflows, or calendar appointments belonging to Chef Bella's Cake Studio or any other tenant. Every database query enforces strict Row Level Security (RLS) on Supabase."*

---

### 1:00 – 2:00 | 3. Business Profile & Workflow Builder
* **Action on Screen**: Click on **Workflow Builder** in the sidebar. Walk through the 5 steps: Identity, Greeting, Fields, Urgency Rules, and Closing.
* **Speaking Points**:
  > *"Let's examine how a business customizes their AI receptionist. In the Visual Workflow Studio, Dr. Sharma can configure:*
  > 1. *The Missed-Call trigger and business persona.*
  > 2. *The spoken opening greeting delivered by Deepgram Aura.*
  > 3. *The exact parameters to gather: Patient Full Name, Phone, Doctor/Specialty, Preferred Date, and Preferred Time.*
  > 4. *Smart Condition Rules: For example, if a caller mentions 'chest pain' or 'shortness of breath', the urgency is escalated to 'Urgent' priority immediately.*
  > 5. *The post-call action—here set to autonomously book an appointment on Google Calendar.*
  >
  > *The entire workflow is stored as JSONB in PostgreSQL and dynamically injected into Gemini's system prompt."*

---

### 2:00 – 3:30 | 4. Clinic Missed-Call Voice Workflow
* **Action on Screen**: Navigate to **Voice Simulator**. Select the preset **Priya Sharma** (`+91 98201 12345`). Click **"Simulate Missed Call Callback"**. Show the glowing Voice Orb, live audio waveform, and caller audio.
* **Speaking Points**:
  > *"Now let's see the complete live callback pipeline in action. We'll simulate an outbound callback to patient Priya Sharma.*
  >
  > *Notice that we strictly do not use browser SpeechRecognition or browser speechSynthesis. Audio from the microphone is captured via MediaRecorder, sent to our Next.js serverless route `/api/voice/stt`, and transcribed by Deepgram Nova-2.*
  >
  > *The assistant speaks: 'Hello Priya, this is Apex Care Medical Centre calling you back after missing your call. Are you calling to book a new appointment or reschedule?'*
  >
  > *Priya responds: 'Hi, I need to see Dr. Sharma in cardiology tomorrow around 4:00 PM for a blood pressure checkup.' The live transcript streams simultaneously with avatars and timestamps."*

---

### 3:30 – 4:30 | 5. Gemini Autonomous Google Calendar Tool Calling
* **Action on Screen**: Point to the live HUD **Information Collected** checklist and the tool call pill in the transcript. Then switch to the **Google Calendar** tab.
* **Speaking Points**:
  > *"Watch what happens behind the scenes. Gemini 1.5 Flash reasons about Priya's request and autonomously decides to execute a function call: `checkCalendarAvailability` for tomorrow at 4:00 PM.*
  >
  > *It validates that Dr. Sharma's calendar has an open 45-minute slot. Once confirmed, it invokes `createCalendarEvent`, reserving the slot on Google Calendar and generating a verified event ID.*
  >
  > *If there had been a scheduling conflict, Gemini would have intelligently detected the overlap and suggested alternative slots like 10:30 AM or 2:00 PM. Notice the Google Calendar tab now shows Priya Sharma's confirmed Cardiology appointment with date badge, time range, and contact phone."*

---

### 4:30 – 5:15 | 6. Triage Dashboard, AI Summary & Transcript
* **Action on Screen**: Click on **Dashboard & Records** in the sidebar. Show the 4 KPI metric cards, the new conversation row, the extracted fields badge, and toggle follow-up status from `contacted` to `completed`.
* **Speaking Points**:
  > *"In the executive Dashboard, practice staff have complete visibility into all handled missed calls:*
  > * 4 live KPI cards track Total Handled, Urgent Alerts, Pending Contact, and Resolved cases.*
  > * In the record list, Priya Sharma's call is categorized with intent, phone number, and a crisp AI summary.*
  > * The receptionist can review the complete turn-by-turn dialogue transcript modal, copy the summary in one click, and update the follow-up status from 'Contacted' to 'Completed'. All updates persist instantly to the database."*

---

### 5:15 – 6:15 | 7. Second Use Case: Sweet Delights Cake Studio
* **Action on Screen**: In the Top Header, open the business switcher dropdown and switch to **Sweet Delights Artisan Cake Studio**. Navigate to the Voice Simulator and select **Rohan Mehta** (`+91 98112 54321`).
* **Speaking Points**:
  > *"To demonstrate adaptability across different industries, let's switch to Sweet Delights Artisan Cake Studio.*
  >
  > *The entire UI and assistant persona shift seamlessly from clinical to creative retail. We simulate a callback for caller Rohan Mehta, who needs a 2kg Belgian Chocolate Truffle cake for an anniversary celebration tonight.*
  >
  > *Because the order is required within 24 hours, the custom condition rule triggers! The assistant highlights this as an URGENT kitchen priority, collects the inscription message, delivery address, and budget, and alerts the baking team."*

---

### 6:15 – 6:45 | 8. Bilingual Indian Language Support (Hindi & Hinglish)
* **Action on Screen**: In the Voice Simulator, select the preset **Aarav Gupta** (`+91 98765 43210`, language set to `hi`). Click simulate.
* **Speaking Points**:
  > *"A critical requirement for Indian healthcare and retail is native multilingual support. Invyra.ai features full Hindi and bilingual Hinglish conversational fluency.*
  >
  > *When Aarav speaks in Hindi: 'नमस्ते! मुझे कल सुबह डॉ. शर्मा से मिलना है, क्या 10:30 बजे का समय खाली है?', Gemini recognizes the Hindi intent, checks the calendar in the background, and replies in natural Hindi: 'जी हाँ, कल सुबह 10:30 बजे का समय उपलब्ध है...'.*
  >
  > *Deepgram Aura renders the speech with clear natural prosody, and both Hindi and English transcripts are preserved."*

---

### 6:45 – 7:20 | 9. Architecture, Database & Security
* **Action on Screen**: Open the **Settings & Security** tab. Show the clean service status tiles (Voice Service: Active, AI Assistant: Active, Database: Connected, Google Calendar: Connected) and Account & Security card.
* **Speaking Points**:
  > *"Let's review the architectural implementation:*
  > * **Frontend**: Next.js 14 App Router with Tailwind CSS and responsive layout for mobile, tablet, and desktop.*
  > * **Backend**: Next.js Route Handlers strictly manage all sensitive API keys. Server keys like `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and Google Service Account private keys NEVER reach the browser.*
  > * **Zero Secrets in Client**: The client bundle contains only public identifiers. The settings page exposes zero environment variable strings or credentials.*
  > * **Automated Test Suite**: We have an automated 26-test security suite verifying unauthenticated blocks, cross-tenant isolation, and IDOR protection."*

---

### 7:20 – 8:00 | 10. Honest Evaluation & Production Roadmap
* **Action on Screen**: Return to the main Voice Operations Command view.
* **Speaking Points**:
  > *"To summarize honestly:*
  > * **What is fully live & working**: 5-step Workflow Builder, full Deepgram Nova-2 STT & Aura TTS serverless pipeline, Gemini 1.5 autonomous tool calling, Google Calendar dual-mode sync, bilingual English/Hindi dialogue, scrypt multi-tenant authentication, and customer record management.*
  > * **What is simulated**: Inbound telephony SIP trunking is simulated via our interactive Web Voice Simulator, allowing thorough testing without carrier charges.*
  > * **Production Roadmap**: Next steps include connecting Twilio/Exotel webhooks for live carrier phone lines, and integrating an automated WhatsApp gateway for instant booking confirmations.*
  >
  > *Thank you for reviewing Invyra.ai!"*
