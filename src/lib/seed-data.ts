import { Business, Workflow, ConversationRecord, CalendarEvent } from "./types";

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "b-clinic-001",
    name: "Apex Care Multi-Specialty Clinic",
    industry: "Clinic & Healthcare",
    phone: "+1 (555) 382-4411",
    timezone: "America/New_York",
    operating_hours: "Mon-Sat: 8:30 AM - 7:00 PM",
    tone: "Empathetic, reassuring, professional and efficient. Never give medical diagnoses.",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "b-bakery-002",
    name: "Sweet Delights Artisan Cake Studio",
    industry: "Bakery & Cake Shop",
    phone: "+1 (555) 794-2201",
    timezone: "America/New_York",
    operating_hours: "Tue-Sun: 9:00 AM - 8:00 PM",
    tone: "Warm, cheerful, creative, and enthusiastic.",
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "b-logistics-003",
    name: "SwiftLogistics Express Dispatch",
    industry: "Delivery & Logistics",
    phone: "+1 (555) 912-8833",
    timezone: "America/New_York",
    operating_hours: "24/7 Operations",
    tone: "Crisp, urgent, precise, and solution-oriented.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "wf-clinic-booking",
    business_id: "b-clinic-001",
    name: "Clinic Missed Call - Appointment Booking & Rescheduling",
    trigger: "missed_call",
    greeting: "Hello! This is Apex Care Medical Centre calling you back after missing your call. Are you calling to book a new appointment, reschedule, or inquire about clinic hours?",
    fields_schema: [
      {
        key: "patient_name",
        label: "Patient Full Name",
        type: "text",
        required: true,
        promptQuestion: "May I please have the patient's full name?"
      },
      {
        key: "phone_number",
        label: "Contact Phone Number",
        type: "text",
        required: true,
        promptQuestion: "What is the best phone number to confirm the appointment?"
      },
      {
        key: "doctor_specialty",
        label: "Doctor or Specialty",
        type: "select",
        required: true,
        promptQuestion: "Which doctor or specialty are you looking for? We have General Physicians, Cardiology, Dermatology, and Pediatrics.",
        options: ["General Physician", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics"]
      },
      {
        key: "preferred_date",
        label: "Preferred Date",
        type: "date",
        required: true,
        promptQuestion: "What date works best for you?"
      },
      {
        key: "preferred_time",
        label: "Preferred Time Slot",
        type: "time",
        required: true,
        promptQuestion: "What time do you prefer, such as morning at 10 AM or afternoon at 4 PM?"
      },
      {
        key: "visit_reason",
        label: "Brief Reason for Visit",
        type: "text",
        required: false,
        promptQuestion: "Could you briefly share the main reason for your visit?"
      }
    ],
    conditional_rules: [
      {
        field: "visit_reason",
        operator: "contains",
        value: "chest pain",
        resultUrgency: "urgent",
        resultNote: "Potential cardiac emergency flagged. Prompt patient to seek emergency care if acute."
      },
      {
        field: "visit_reason",
        operator: "contains",
        value: "emergency",
        resultUrgency: "urgent",
        resultNote: "Urgent symptom severity declared."
      }
    ],
    action_after_collection: "create_calendar_event",
    closing_message: "Thank you! Your appointment request has been synchronized with our clinic calendar, and an SMS confirmation will be sent shortly.",
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "wf-cake-order",
    business_id: "b-bakery-002",
    name: "Cake Studio Missed Call - Custom Order & Inquiry",
    trigger: "missed_call",
    greeting: "Hi there! This is Sweet Delights Cake Studio returning your call. Are you interested in placing a custom cake order, or did you have a quick question about our menu?",
    fields_schema: [
      {
        key: "customer_name",
        label: "Customer Name",
        type: "text",
        required: true,
        promptQuestion: "Can I get your name please?"
      },
      {
        key: "cake_type",
        label: "Occasion or Cake Style",
        type: "select",
        required: true,
        promptQuestion: "What occasion is the cake for, such as Birthday, Wedding, or Anniversary?",
        options: ["Birthday", "Wedding", "Anniversary", "Custom Theme", "Cupcake Box"]
      },
      {
        key: "flavor",
        label: "Cake Flavor",
        type: "select",
        required: true,
        promptQuestion: "Which flavor would you love? Our favorites are Belgian Chocolate Truffle, Red Velvet, Vanilla Bean, and Fresh Berry.",
        options: ["Belgian Chocolate Truffle", "Red Velvet Cream Cheese", "Madagascar Vanilla Bean", "Fresh Berry Passionfruit", "Lotus Biscoff"]
      },
      {
        key: "weight_kg",
        label: "Weight or Size",
        type: "text",
        required: true,
        promptQuestion: "What size or weight are you looking for, such as 1 kg, 2 kg, or a 2-tier cake?"
      },
      {
        key: "required_date",
        label: "Date Required",
        type: "date",
        required: true,
        promptQuestion: "For what date do you need the cake?"
      },
      {
        key: "custom_message",
        label: "Custom Inscription / Piping",
        type: "text",
        required: false,
        promptQuestion: "Would you like any personalized name or message written on the cake?"
      },
      {
        key: "fulfillment_type",
        label: "Pickup or Delivery",
        type: "select",
        required: true,
        promptQuestion: "Will you pick it up at our studio or do you need delivery?",
        options: ["Store Pickup", "Home Delivery"]
      },
      {
        key: "budget",
        label: "Estimated Budget",
        type: "text",
        required: false,
        promptQuestion: "Do you have a target budget in mind?"
      }
    ],
    conditional_rules: [
      {
        field: "required_date",
        operator: "less_than_or_equal_hours",
        value: "24",
        resultUrgency: "urgent",
        resultNote: "Order needed within 24 hours! Rush kitchen notice required."
      }
    ],
    action_after_collection: "create_order_enquiry",
    closing_message: "Wonderful! Our head baker has received all the details and will text you the digital sketch and invoice. Have a delightful day!",
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  }
];

export const INITIAL_CONVERSATIONS: ConversationRecord[] = [
  {
    id: "conv-101",
    business_id: "b-clinic-001",
    workflow_id: "wf-clinic-booking",
    business_name: "Apex Care Multi-Specialty Clinic",
    workflow_name: "Clinic Missed Call - Appointment Booking & Rescheduling",
    caller_name: "Eleanor Vance",
    caller_phone: "+1 (555) 438-9201",
    status: "completed",
    intent: "Book cardiology consultation appointment",
    collected_data: {
      patient_name: "Eleanor Vance",
      phone_number: "+1 (555) 438-9201",
      doctor_specialty: "Cardiology",
      preferred_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      preferred_time: "16:00",
      visit_reason: "Routine follow-up blood pressure check"
    },
    summary: "Patient Eleanor Vance scheduled a 30-min Cardiology check-up for tomorrow at 4:00 PM. Verified calendar slot availability and reserved appointment.",
    action_performed: "Google Calendar Event Created (Slot confirmed tomorrow at 4:00 PM with Dr. Sharma)",
    priority: "normal",
    follow_up_status: "contacted",
    transcript: [
      { role: "system", message: "Outbound AI callback initiated for missed call.", timestamp: "10:14:00 AM" },
      { role: "assistant", message: "Hello Eleanor, this is Apex Care Medical Centre calling you back after missing your call. Are you calling to book a new appointment or reschedule?", timestamp: "10:14:02 AM" },
      { role: "user", message: "Hi, I missed a call from you. I need to see Dr. Sharma in cardiology tomorrow at 4 PM.", timestamp: "10:14:09 AM" },
      { role: "assistant", message: "Let me check Dr. Sharma's calendar availability for tomorrow at 4:00 PM.", timestamp: "10:14:11 AM", tool_call: { name: "checkCalendarAvailability", args: { date: "tomorrow", startTime: "16:00", doctor: "Dr. Sharma" }, result: { available: true } } },
      { role: "assistant", message: "Great news! Dr. Sharma is open tomorrow at 4:00 PM. May I book this under your name, Eleanor Vance?", timestamp: "10:14:14 AM" },
      { role: "user", message: "Yes, please! Just for a routine blood pressure review.", timestamp: "10:14:19 AM" },
      { role: "assistant", message: "I have booked your appointment for tomorrow at 4:00 PM on our calendar. You will receive an SMS reminder. Thank you!", timestamp: "10:14:24 AM", tool_call: { name: "createCalendarEvent", args: { title: "Cardiology Consultation - Eleanor Vance", date: "tomorrow", startTime: "16:00" }, result: { eventId: "gcal_evt_101", status: "confirmed" } } }
    ],
    language: "en",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "conv-102",
    business_id: "b-bakery-002",
    workflow_id: "wf-cake-order",
    business_name: "Sweet Delights Artisan Cake Studio",
    workflow_name: "Cake Studio Missed Call - Custom Order & Inquiry",
    caller_name: "Rajesh Malhotra",
    caller_phone: "+1 (555) 819-3320",
    status: "completed",
    intent: "Urgent birthday cake order needed today evening",
    collected_data: {
      customer_name: "Rajesh Malhotra",
      cake_type: "Birthday",
      flavor: "Belgian Chocolate Truffle",
      weight_kg: "2 kg",
      required_date: new Date().toISOString().split("T")[0],
      custom_message: "Happy 30th Birthday Priya!",
      fulfillment_type: "Home Delivery",
      budget: ""
    },
    summary: "Customer Rajesh Malhotra placed an urgent 2kg Belgian Chocolate Truffle cake order required within 6 hours. Condition rule triggered: Marked as URGENT for priority kitchen preparation.",
    action_performed: "Urgent Kitchen Dispatch Alert Created & SMS Notification Dispatched",
    priority: "urgent",
    follow_up_status: "pending",
    transcript: [
      { role: "system", message: "Outbound AI callback initiated for missed call.", timestamp: "11:30:00 AM" },
      { role: "assistant", message: "नमस्ते Rajesh! Sweet Delights Cake Studio se call kar rahe hain. Kya aap custom cake order karna chahte hain?", timestamp: "11:30:03 AM" },
      { role: "user", message: "Haan ji! Mujhe aaj shaam tak ek 2kg Belgian chocolate truffle cake chahiye Priya ke birthday ke liye.", timestamp: "11:30:12 AM" },
      { role: "assistant", message: "Bilkul! Aaj shaam ke liye yeh urgent order mark ho raha hai. Cake par kya message likhna hai?", timestamp: "11:30:16 AM" },
      { role: "user", message: "Likh dijiye 'Happy 30th Birthday Priya!'. Aur home delivery chahiye.", timestamp: "11:30:23 AM" },
      { role: "assistant", message: "Order register ho gaya hai aur kitchen ko urgent notification bhej diya hai. Chef aapse turant confirm karenge!", timestamp: "11:30:28 AM" }
    ],
    language: "hi",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "cal-001",
    conversation_id: "conv-101",
    title: "Cardiology Consultation - Eleanor Vance",
    start_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T16:00:00.000Z",
    end_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T16:45:00.000Z",
    attendee_name: "Eleanor Vance",
    attendee_phone: "+1 (555) 438-9201",
    doctor_or_service: "Dr. Sharma (Cardiology)",
    notes: "Follow-up blood pressure check. Booked via Voice AI Assistant.",
    google_event_id: "gcal_evt_101",
    status: "confirmed",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "cal-002",
    title: "General Checkup - Marcus Lee",
    start_time: new Date().toISOString().split("T")[0] + "T11:00:00.000Z",
    end_time: new Date().toISOString().split("T")[0] + "T11:30:00.000Z",
    attendee_name: "Marcus Lee",
    attendee_phone: "+1 (555) 723-9099",
    doctor_or_service: "Dr. Patel (General Physician)",
    notes: "Annual wellness check.",
    google_event_id: "gcal_evt_102",
    status: "confirmed",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];
