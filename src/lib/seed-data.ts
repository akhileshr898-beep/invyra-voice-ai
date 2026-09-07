import { Business, Workflow, ConversationRecord, CalendarEvent, User } from "./types";

export const INITIAL_USERS: User[] = [
  {
    id: "u-clinic-sharma",
    email: "dr.sharma@apexclinic.com",
    owner_name: "Dr. Aryan Sharma",
    password_hash: "fb1dacbd7a7075cae1f2e71d2a8677ce8c06e1d5f8b1de62fb492545e33a6fb2c2871ada104ad8a72573fab930b59c1538b1a66317658fce3a4f504cb91111a1",
    salt: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "u-bakery-bella",
    email: "chef.bella@sweetdelights.com",
    owner_name: "Chef Bella Rossi",
    password_hash: "fb1dacbd7a7075cae1f2e71d2a8677ce8c06e1d5f8b1de62fb492545e33a6fb2c2871ada104ad8a72573fab930b59c1538b1a66317658fce3a4f504cb91111a1",
    salt: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "u-logistics-marcus",
    email: "dispatch@swiftlogistics.com",
    owner_name: "Marcus Vance",
    password_hash: "fb1dacbd7a7075cae1f2e71d2a8677ce8c06e1d5f8b1de62fb492545e33a6fb2c2871ada104ad8a72573fab930b59c1538b1a66317658fce3a4f504cb91111a1",
    salt: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "b-clinic-001",
    owner_user_id: "u-clinic-sharma",
    owner_name: "Dr. Aryan Sharma",
    email: "dr.sharma@apexclinic.com",
    name: "Apex Care Multi-Specialty Clinic",
    industry: "Clinic & Healthcare",
    phone: "+1 (555) 382-4411",
    business_address: "742 Evergreen Terrace, Suite 100, New York, NY",
    preferred_language: "English & Hindi",
    timezone: "America/New_York",
    operating_hours: "Mon-Sat: 8:30 AM - 7:00 PM",
    tone: "Empathetic, reassuring, professional and efficient. Never give medical diagnoses.",
    google_calendar_connected: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "b-bakery-002",
    owner_user_id: "u-bakery-bella",
    owner_name: "Chef Bella Rossi",
    email: "chef.bella@sweetdelights.com",
    name: "Sweet Delights Artisan Cake Studio",
    industry: "Bakery & Cake Shop",
    phone: "+1 (555) 794-2201",
    business_address: "128 Baker St, New York, NY",
    preferred_language: "English",
    timezone: "America/New_York",
    operating_hours: "Tue-Sun: 9:00 AM - 8:00 PM",
    tone: "Warm, cheerful, creative, and enthusiastic.",
    google_calendar_connected: false,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "b-logistics-003",
    owner_user_id: "u-logistics-marcus",
    owner_name: "Marcus Vance",
    email: "dispatch@swiftlogistics.com",
    name: "SwiftLogistics Express Dispatch",
    industry: "Delivery & Logistics",
    phone: "+1 (555) 912-8833",
    business_address: "500 Harbor Blvd, Dispatch Dock 4, New York, NY",
    preferred_language: "English",
    timezone: "America/New_York",
    operating_hours: "24/7 Operations",
    tone: "Crisp, urgent, precise, and solution-oriented.",
    google_calendar_connected: false,
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
    caller_name: "Priya Sharma",
    caller_phone: "+91 98201 12345",
    status: "completed",
    intent: "Book cardiology consultation appointment",
    collected_data: {
      patient_name: "Priya Sharma",
      phone_number: "+91 98201 12345",
      doctor_specialty: "Cardiology",
      preferred_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      preferred_time: "16:00",
      visit_reason: "Routine follow-up blood pressure check"
    },
    summary: "Patient Priya Sharma scheduled a 45-min Cardiology consultation for tomorrow at 4:00 PM. Verified calendar slot availability and reserved appointment with Dr. Sharma.",
    action_performed: "Google Calendar Event Created (Slot confirmed tomorrow at 4:00 PM with Dr. Sharma)",
    priority: "normal",
    follow_up_status: "contacted",
    transcript: [
      { role: "system", message: "Outbound AI callback initiated for missed call.", timestamp: "10:14:00 AM" },
      { role: "assistant", message: "Hello Priya, this is Apex Care Medical Centre calling you back after missing your call. Are you calling to book a new appointment or reschedule?", timestamp: "10:14:02 AM" },
      { role: "user", message: "Hi, I missed a call from your clinic. I would like to see Dr. Sharma in cardiology tomorrow around 4 PM.", timestamp: "10:14:09 AM" },
      { role: "assistant", message: "Let me check Dr. Sharma's calendar availability for tomorrow at 4:00 PM.", timestamp: "10:14:11 AM", tool_call: { name: "checkCalendarAvailability", args: { date: "tomorrow", startTime: "16:00", doctor: "Dr. Sharma" }, result: { available: true } } },
      { role: "assistant", message: "Dr. Sharma is open tomorrow at 4:00 PM. Shall I reserve this appointment under your name, Priya Sharma?", timestamp: "10:14:14 AM" },
      { role: "user", message: "Yes please, for a routine cardiology checkup.", timestamp: "10:14:19 AM" },
      { role: "assistant", message: "Your consultation has been confirmed for tomorrow at 4:00 PM. An SMS confirmation has been sent to +91 98201 12345. Thank you!", timestamp: "10:14:24 AM", tool_call: { name: "createCalendarEvent", args: { title: "Cardiology Consultation - Priya Sharma", date: "tomorrow", startTime: "16:00" }, result: { eventId: "gcal_evt_101", status: "confirmed" } } }
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
    caller_phone: "+91 98112 54321",
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
      budget: "₹2,500"
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
  },
  {
    id: "conv-103",
    business_id: "b-clinic-001",
    workflow_id: "wf-clinic-booking",
    business_name: "Apex Care Multi-Specialty Clinic",
    workflow_name: "Clinic Missed Call - Appointment Booking & Rescheduling",
    caller_name: "Aarav Gupta",
    caller_phone: "+91 98765 43210",
    status: "completed",
    intent: "डॉक्टर परामर्श अपॉइंटमेंट बुकिंग (Hindi Voice Callback)",
    collected_data: {
      patient_name: "Aarav Gupta",
      phone_number: "+91 98765 43210",
      doctor_specialty: "General Physician",
      preferred_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      preferred_time: "10:30",
      visit_reason: "मौसमी बुखार एवं स्वास्थ्य जांच"
    },
    summary: "मरीज Aarav Gupta ने कल सुबह 10:30 बजे डॉ. आर्यन शर्मा के साथ सामान्य परामर्श बुक किया। गूगल कैलेंडर स्लॉट उपलब्ध पाया गया और पुष्टि की गई।",
    action_performed: "गूगल कैलेंडर इवेंट बुक किया गया (कल सुबह 10:30 बजे - डॉ. शर्मा)",
    priority: "normal",
    follow_up_status: "completed",
    transcript: [
      { role: "system", message: "Outbound AI callback initiated for missed call.", timestamp: "09:15:00 AM" },
      { role: "assistant", message: "नमस्ते Aarav जी! एपेक्स केयर क्लिनिक से आपकी मिस्ड कॉल के संदर्भ में बात कर रहे हैं। क्या आप नया अपॉइंटमेंट बुक करना चाहते हैं?", timestamp: "09:15:03 AM" },
      { role: "user", message: "नमस्ते! मुझे कल सुबह डॉ. शर्मा से मिलना है। क्या 10:30 बजे का समय खाली है?", timestamp: "09:15:10 AM" },
      { role: "assistant", message: "मैं कैलेंडर की उपलब्धता जांच रही हूँ...", timestamp: "09:15:12 AM", tool_call: { name: "checkCalendarAvailability", args: { date: "tomorrow", startTime: "10:30", doctorOrService: "Dr. Sharma" }, result: { available: true } } },
      { role: "assistant", message: "जी हाँ, कल सुबह 10:30 बजे का स्लॉट उपलब्ध है। क्या मैं यह अपॉइंटमेंट आरव गुप्ता के नाम से बुक कर दूँ?", timestamp: "09:15:15 AM" },
      { role: "user", message: "हाँ, कृपया बुक कर दीजिए।", timestamp: "09:15:20 AM" },
      { role: "assistant", message: "आपका अपॉइंटमेंट कल सुबह 10:30 बजे के लिए कन्फर्म कर दिया गया है। धन्यवाद!", timestamp: "09:15:24 AM", tool_call: { name: "createCalendarEvent", args: { title: "General Consultation - Aarav Gupta", date: "tomorrow", startTime: "10:30" }, result: { eventId: "gcal_evt_103", status: "confirmed" } } }
    ],
    language: "hi",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "cal-001",
    business_id: "b-clinic-001",
    conversation_id: "conv-101",
    title: "Cardiology Consultation - Priya Sharma",
    start_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T16:00:00.000Z",
    end_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T16:45:00.000Z",
    attendee_name: "Priya Sharma",
    attendee_phone: "+91 98201 12345",
    doctor_or_service: "Dr. Sharma (Cardiology)",
    notes: "Follow-up blood pressure check. Booked via Voice AI Assistant.",
    google_event_id: "gcal_evt_101",
    status: "confirmed",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "cal-002",
    business_id: "b-clinic-001",
    conversation_id: "conv-103",
    title: "General Consultation - Aarav Gupta",
    start_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T10:30:00.000Z",
    end_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T11:15:00.000Z",
    attendee_name: "Aarav Gupta",
    attendee_phone: "+91 98765 43210",
    doctor_or_service: "Dr. Aryan Sharma (General Physician)",
    notes: "Seasonal fever consultation. Booked via Hindi Voice AI callback.",
    google_event_id: "gcal_evt_103",
    status: "confirmed",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "cal-003",
    business_id: "b-clinic-001",
    title: "Routine Health Checkup - Ananya Iyer",
    start_time: new Date().toISOString().split("T")[0] + "T14:00:00.000Z",
    end_time: new Date().toISOString().split("T")[0] + "T14:45:00.000Z",
    attendee_name: "Ananya Iyer",
    attendee_phone: "+91 98450 67890",
    doctor_or_service: "Dr. Aryan Sharma",
    notes: "Annual wellness checkup.",
    google_event_id: "gcal_evt_104",
    status: "confirmed",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];
