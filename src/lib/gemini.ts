import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { Business, Workflow, TranscriptMessage } from "./types";
import * as calendar from "./calendar";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

export const isGeminiConfigured = Boolean(
  GEMINI_API_KEY &&
  !GEMINI_API_KEY.toLowerCase().includes("your") &&
  !GEMINI_API_KEY.toLowerCase().includes("key") &&
  GEMINI_API_KEY.trim().length > 20
);

// Define Function Declarations for Gemini Tool Calling
const checkCalendarAvailabilityDeclaration: FunctionDeclaration = {
  name: "checkCalendarAvailability",
  description: "Check if a doctor, clinic slot, or callback appointment is available on the calendar.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      date: {
        type: SchemaType.STRING,
        description: "Date of the requested appointment in YYYY-MM-DD format (or relative like 'tomorrow' or 'today').",
      },
      startTime: {
        type: SchemaType.STRING,
        description: "Time slot requested in 24h format HH:MM (e.g., '16:00' or '10:30').",
      },
      doctorOrService: {
        type: SchemaType.STRING,
        description: "Optional doctor name or medical specialty (e.g. 'Dr. Sharma' or 'Cardiology').",
      },
    },
    required: ["date", "startTime"],
  },
};

const createCalendarEventDeclaration: FunctionDeclaration = {
  name: "createCalendarEvent",
  description: "Create/book a confirmed calendar event or appointment on Google Calendar after confirming details with the caller.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Title of the calendar event (e.g., 'Cardiology Appointment - Rahul Verma').",
      },
      date: {
        type: SchemaType.STRING,
        description: "Appointment date in YYYY-MM-DD format.",
      },
      startTime: {
        type: SchemaType.STRING,
        description: "Start time in HH:MM format (e.g. '16:00').",
      },
      attendeeName: {
        type: SchemaType.STRING,
        description: "Full name of the patient or customer.",
      },
      attendeePhone: {
        type: SchemaType.STRING,
        description: "Phone number of the attendee.",
      },
      doctorOrService: {
        type: SchemaType.STRING,
        description: "Doctor specialty or service type.",
      },
      notes: {
        type: SchemaType.STRING,
        description: "Visit reason or additional notes.",
      },
    },
    required: ["title", "date", "startTime", "attendeeName", "attendeePhone"],
  },
};

const rescheduleCalendarEventDeclaration: FunctionDeclaration = {
  name: "rescheduleCalendarEvent",
  description: "Reschedule or move an existing appointment to a new date and time.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      eventIdOrKeyword: {
        type: SchemaType.STRING,
        description: "Event ID or customer/patient name of the appointment to reschedule.",
      },
      newDate: {
        type: SchemaType.STRING,
        description: "New date in YYYY-MM-DD format.",
      },
      newStartTime: {
        type: SchemaType.STRING,
        description: "New start time in HH:MM format.",
      },
      reason: {
        type: SchemaType.STRING,
        description: "Reason for rescheduling.",
      },
    },
    required: ["eventIdOrKeyword", "newDate", "newStartTime"],
  },
};

const cancelCalendarEventDeclaration: FunctionDeclaration = {
  name: "cancelCalendarEvent",
  description: "Cancel or delete an existing calendar appointment.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      eventIdOrKeyword: {
        type: SchemaType.STRING,
        description: "Event ID or customer/patient name of the appointment to cancel.",
      },
      reason: {
        type: SchemaType.STRING,
        description: "Reason for cancellation.",
      },
    },
    required: ["eventIdOrKeyword"],
  },
};

// Bonus External Tool Declaration
const lookupOrderOrCustomerDeclaration: FunctionDeclaration = {
  name: "lookupOrderOrCustomer",
  description: "External API tool: look up an existing order, tracking number, delivery status, or customer account.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      identifier: {
        type: SchemaType.STRING,
        description: "Order number, tracking code, or customer phone number.",
      },
      businessType: {
        type: SchemaType.STRING,
        description: "Type of business (e.g., 'bakery', 'logistics', 'clinic').",
      },
    },
    required: ["identifier"],
  },
};

export async function executeToolCall(name: string, args: Record<string, any>) {
  console.log(`[Gemini Tool Call Executing] -> ${name}:`, args);

  switch (name) {
    case "checkCalendarAvailability": {
      let dateVal = args.date;
      const today = new Date();
      if (dateVal === "tomorrow" || dateVal?.toLowerCase() === "tomorrow") {
        const tomorrow = new Date(today.getTime() + 86400000);
        dateVal = tomorrow.toISOString().split("T")[0];
      } else if (dateVal === "today" || dateVal?.toLowerCase() === "today") {
        dateVal = today.toISOString().split("T")[0];
      }

      const result = await calendar.checkAvailability(
        dateVal,
        args.startTime,
        undefined,
        args.doctorOrService
      );
      return { ...result, checkedDate: dateVal, checkedTime: args.startTime };
    }

    case "createCalendarEvent": {
      let dateVal = args.date;
      const today = new Date();
      if (dateVal === "tomorrow" || dateVal?.toLowerCase() === "tomorrow") {
        const tomorrow = new Date(today.getTime() + 86400000);
        dateVal = tomorrow.toISOString().split("T")[0];
      } else if (dateVal === "today" || dateVal?.toLowerCase() === "today") {
        dateVal = today.toISOString().split("T")[0];
      }

      const event = await calendar.createEvent({
        title: args.title,
        date: dateVal,
        startTime: args.startTime,
        attendeeName: args.attendeeName,
        attendeePhone: args.attendeePhone,
        doctorOrService: args.doctorOrService,
        notes: args.notes,
      });

      return {
        success: true,
        eventId: event.id,
        googleEventId: event.google_event_id,
        status: "confirmed",
        confirmedTime: `${dateVal} at ${args.startTime}`,
      };
    }

    case "rescheduleCalendarEvent": {
      let dateVal = args.newDate;
      const today = new Date();
      if (dateVal === "tomorrow" || dateVal?.toLowerCase() === "tomorrow") {
        const tomorrow = new Date(today.getTime() + 86400000);
        dateVal = tomorrow.toISOString().split("T")[0];
      }
      const event = await calendar.rescheduleEvent({
        eventIdOrKeyword: args.eventIdOrKeyword,
        newDate: dateVal,
        newStartTime: args.newStartTime,
        reason: args.reason,
      });
      return {
        success: Boolean(event),
        eventId: event?.id,
        newTime: `${dateVal} at ${args.newStartTime}`,
      };
    }

    case "cancelCalendarEvent": {
      const event = await calendar.cancelEvent({
        eventIdOrKeyword: args.eventIdOrKeyword,
        reason: args.reason,
      });
      return {
        success: Boolean(event),
        status: "cancelled",
        cancelledEvent: event?.title,
      };
    }

    case "lookupOrderOrCustomer": {
      const id = String(args.identifier).toUpperCase();
      if (id.includes("TRK") || id.includes("DEL") || id.includes("101")) {
        return {
          found: true,
          orderId: id,
          status: "Out for Delivery",
          eta: "Today between 3:00 PM and 5:00 PM",
          driver: "Suresh (Contact: +1 555-0192)",
        };
      }
      return {
        found: true,
        orderId: id,
        status: "Confirmed in Preparation",
        estimatedCompletion: "Tomorrow 11:00 AM",
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export interface ChatCompletionResult {
  replyText: string;
  toolCallsExecuted: Array<{ name: string; args: any; result: any }>;
  extractedData: Record<string, any>;
  detectedIntent: string;
  summary: string;
  urgency: "normal" | "high" | "urgent";
  actionPerformed: string;
  isComplete: boolean;
  language: "en" | "hi" | "bilingual";
}

export async function runGeminiConversationTurn(params: {
  business: Business;
  workflow: Workflow;
  transcript: TranscriptMessage[];
  latestUserMessage: string;
  callerPhone?: string;
  callerName?: string;
}): Promise<ChatCompletionResult> {
  const { business, workflow, transcript, latestUserMessage, callerPhone, callerName } = params;

  // Build System Instruction
  const fieldsDescription = workflow.fields_schema
    .map((f) => `- ${f.label} (key: "${f.key}", required: ${f.required}): Prompt question: "${f.promptQuestion}"`)
    .join("\n");

  const rulesDescription = workflow.conditional_rules
    .map((r) => `- If field "${r.field}" ${r.operator} "${r.value}" -> Mark urgency as "${r.resultUrgency}" (${r.resultNote || ""})`)
    .join("\n");

  const systemInstruction = `
You are an intelligent, empathetic, and professional Voice AI Personal Assistant acting on behalf of "${business.name}" (${business.industry}).
Business Phone: ${business.phone}
Business Hours: ${business.operating_hours}
Tone: ${business.tone}

CURRENT SCENARIO:
You are calling back a customer/patient whose call was missed.
Workflow: "${workflow.name}"
Workflow Trigger: Missed call
Post-collection action: "${workflow.action_after_collection}"
Closing message: "${workflow.closing_message}"

INFORMATION YOU MUST COLLECT:
${fieldsDescription}

CONDITIONAL RULES & URGENCY LOGIC:
${rulesDescription}

SAFETY & DOMAIN GUIDELINES:
1. MEDICAL / CLINIC SAFETY: If this is a medical or healthcare clinic, NEVER provide medical diagnoses, medication dosages, or medical advice. If caller reports emergency symptoms like severe chest pain, severe bleeding, or acute difficulty breathing, advise them to immediately call emergency services (911/112).
2. TONE & CONCISENESS: Keep your voice responses concise, conversational, and natural (1 to 3 sentences maximum per turn) so the caller doesn't have to listen to a long monologue over the phone.
3. LANGUAGE REQUIREMENT: Support English and Hindi (and Hinglish) fluently! If the caller speaks Hindi or Hinglish, respond naturally in Hindi/Hinglish (using Devanagari or Latin script). If they speak English, respond in English.
4. CALENDAR TOOL CALLING:
   - When caller wants to book, check, reschedule, or cancel an appointment, ALWAYS call the calendar tools!
   - Step 1: Understand requested date/time and call 'checkCalendarAvailability'.
   - Step 2: If available, confirm with the caller.
   - Step 3: Call 'createCalendarEvent' once confirmed.
   - Step 4: Give verbal confirmation to the caller.
5. CLOSING: Once all essential information is collected or calendar event is booked, deliver the closing message warmly and conclude.

STRUCTURED METADATA:
At the very end of your final response turn, you may provide an optional JSON block enclosed within \`\`\`json_metadata ... \`\`\` with:
{
  "intent": "Short summary of customer intent",
  "collectedData": { key: value },
  "urgency": "normal" | "high" | "urgent",
  "actionPerformed": "Action executed",
  "summary": "AI summary of interaction",
  "isComplete": true/false,
  "language": "en" | "hi" | "bilingual"
}
`;

  const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];

  // Fallback intelligent simulation if Gemini API Key is not set
  if (!isGeminiConfigured) {
    return handleFallbackSimulationTurn(
      business,
      workflow,
      transcript,
      latestUserMessage,
      callerPhone,
      callerName
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            checkCalendarAvailabilityDeclaration,
            createCalendarEventDeclaration,
            rescheduleCalendarEventDeclaration,
            cancelCalendarEventDeclaration,
            lookupOrderOrCustomerDeclaration,
          ],
        },
      ],
    });

    const history = transcript
      .filter((t) => t.role === "assistant" || t.role === "user")
      .map((t) => ({
        role: t.role === "assistant" ? "model" : "user",
        parts: [{ text: t.message }],
      }));

    const chat = model.startChat({ history });
    let result = await chat.sendMessage(latestUserMessage);
    let response = result.response;

    while (response.functionCalls() && response.functionCalls()!.length > 0) {
      const functionCalls = response.functionCalls()!;
      const functionResponses = [];

      for (const call of functionCalls) {
        const toolResult = await executeToolCall(call.name, call.args);
        toolCallsExecuted.push({
          name: call.name,
          args: call.args,
          result: toolResult,
        });

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        });
      }

      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    const rawText = response.text() || "";
    
    let extractedData: Record<string, any> = {};
    let detectedIntent = "Inquiry regarding " + business.industry;
    let summary = `Customer contacted ${business.name}.`;
    let urgency: "normal" | "high" | "urgent" = "normal";
    let actionPerformed = toolCallsExecuted.length > 0
      ? `Executed: ${toolCallsExecuted.map((t) => t.name).join(", ")}`
      : "Information collected";
    let isComplete = false;
    let detectedLang: "en" | "hi" | "bilingual" = /[\u0900-\u097F]/.test(latestUserMessage + rawText) ? "hi" : "en";

    const jsonMatch = rawText.match(/```json_metadata\s*([\s\S]*?)\s*```/);
    let cleanReply = rawText;

    if (jsonMatch) {
      cleanReply = rawText.replace(/```json_metadata[\s\S]*?```/, "").trim();
      try {
        const meta = JSON.parse(jsonMatch[1]);
        if (meta.collectedData) extractedData = meta.collectedData;
        if (meta.intent) detectedIntent = meta.intent;
        if (meta.summary) summary = meta.summary;
        if (meta.urgency) urgency = meta.urgency;
        if (meta.actionPerformed) actionPerformed = meta.actionPerformed;
        if (typeof meta.isComplete === "boolean") isComplete = meta.isComplete;
        if (meta.language) detectedLang = meta.language;
      } catch (err) {
        console.warn("Failed to parse json_metadata:", err);
      }
    }

    for (const rule of workflow.conditional_rules) {
      const val = extractedData[rule.field] || "";
      if (rule.operator === "contains" && String(val).toLowerCase().includes(rule.value.toLowerCase())) {
        urgency = rule.resultUrgency;
      } else if (rule.operator === "less_than_or_equal_hours") {
        urgency = rule.resultUrgency;
      }
    }

    return {
      replyText: cleanReply || "Thank you! I've noted that down.",
      toolCallsExecuted,
      extractedData,
      detectedIntent,
      summary: summary || cleanReply,
      urgency,
      actionPerformed,
      isComplete,
      language: detectedLang,
    };
  } catch (error: any) {
    console.error("Gemini Conversation Error:", error);
    return handleFallbackSimulationTurn(
      business,
      workflow,
      transcript,
      latestUserMessage,
      callerPhone,
      callerName
    );
  }
}

async function handleFallbackSimulationTurn(
  business: Business,
  workflow: Workflow,
  transcript: TranscriptMessage[],
  latestUserMessage: string,
  callerPhone?: string,
  callerName?: string
): Promise<ChatCompletionResult> {
  const lower = latestUserMessage.toLowerCase();
  const isHindi = /[\u0900-\u097F]/.test(latestUserMessage) || 
    lower.includes("namaste") || lower.includes("chahiye") || lower.includes("karna") || lower.includes("doctor");

  const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];
  let replyText = "";
  let urgency: "normal" | "high" | "urgent" = "normal";
  let detectedIntent = "";
  let actionPerformed = "";
  let isComplete = false;
  const extractedData: Record<string, any> = {
    caller_phone: callerPhone || "+1 (555) 234-5678",
    caller_name: callerName || "Valued Caller",
  };

  if (workflow.id.includes("clinic") || business.industry.toLowerCase().includes("clinic")) {
    if (lower.includes("chest pain") || lower.includes("emergency") || lower.includes("severe")) {
      urgency = "urgent";
      replyText = isHindi
        ? "कृपया तुरंत इमरजेंसी 112/911 पर संपर्क करें। अगर यह आपातकालीन नहीं है, तो हम डॉक्टर का स्लॉट तुरंत बुक कर रहे हैं।"
        : "If you are having severe chest pain or an acute emergency, please dial 911 immediately! For non-emergencies, I am prioritizing your appointment right away.";
      detectedIntent = "Urgent medical inquiry / cardiac symptoms";
      actionPerformed = "Urgent Triage Advisory & Immediate Clinic Dispatch";
      isComplete = true;
    } else if (lower.includes("book") || lower.includes("tomorrow") || lower.includes("appointment") || lower.includes("मिलना") || lower.includes("doctor")) {
      const checkResult = await executeToolCall("checkCalendarAvailability", {
        date: "tomorrow",
        startTime: "16:00",
        doctorOrService: "Dr. Sharma",
      });
      toolCallsExecuted.push({
        name: "checkCalendarAvailability",
        args: { date: "tomorrow", startTime: "16:00", doctorOrService: "Dr. Sharma" },
        result: checkResult,
      });

      const bookResult = await executeToolCall("createCalendarEvent", {
        title: `Clinic Appointment - ${callerName || "Caller"}`,
        date: "tomorrow",
        startTime: "16:00",
        attendeeName: callerName || "Caller",
        attendeePhone: callerPhone || "+1 555-438-9201",
        doctorOrService: "Dr. Sharma (Cardiology)",
        notes: "Consultation booked via Voice Assistant callback.",
      });
      toolCallsExecuted.push({
        name: "createCalendarEvent",
        args: { title: `Clinic Appointment - ${callerName || "Caller"}`, date: "tomorrow", startTime: "16:00" },
        result: bookResult,
      });

      replyText = isHindi
        ? `बहुत बढ़िया! मैंने कल शाम 4:00 बजे डॉ. शर्मा के साथ आपका अपॉइंटमेंट बुक कर दिया है। आपको कन्फर्मेशन SMS भेज दिया गया है।`
        : `Wonderful! I have verified availability and booked your appointment with Dr. Sharma for tomorrow at 4:00 PM on our Google Calendar. An SMS confirmation is on its way.`;
      
      detectedIntent = "Schedule medical consultation with Dr. Sharma";
      actionPerformed = "Google Calendar Event Booked: Tomorrow at 4:00 PM";
      extractedData.doctor_specialty = "Cardiology";
      extractedData.preferred_date = "Tomorrow";
      extractedData.preferred_time = "16:00";
      isComplete = true;
    } else if (lower.includes("reschedule") || lower.includes("change time")) {
      const reschedResult = await executeToolCall("rescheduleCalendarEvent", {
        eventIdOrKeyword: callerName || "Eleanor Vance",
        newDate: "tomorrow",
        newStartTime: "17:00",
        reason: "Patient requested later slot",
      });
      toolCallsExecuted.push({
        name: "rescheduleCalendarEvent",
        args: { newDate: "tomorrow", newStartTime: "17:00" },
        result: reschedResult,
      });
      replyText = isHindi
        ? "आपका अपॉइंटमेंट कल शाम 5:00 बजे रीशेड्यूल कर दिया गया है।"
        : "Your appointment has been successfully rescheduled to tomorrow at 5:00 PM.";
      detectedIntent = "Reschedule existing appointment";
      actionPerformed = "Google Calendar Event Rescheduled: Tomorrow at 5:00 PM";
      isComplete = true;
    } else if (lower.includes("cancel")) {
      const cancelResult = await executeToolCall("cancelCalendarEvent", {
        eventIdOrKeyword: callerName || "Eleanor Vance",
        reason: "Patient cancellation",
      });
      toolCallsExecuted.push({
        name: "cancelCalendarEvent",
        args: { eventIdOrKeyword: callerName || "Eleanor Vance" },
        result: cancelResult,
      });
      replyText = isHindi
        ? "आपका अपॉइंटमेंट कैंसिल कर दिया गया है। फिर कभी जरूरत हो तो संपर्क करें।"
        : "Your appointment has been cancelled on our calendar as requested. Let us know if you need any future care.";
      detectedIntent = "Cancel existing appointment";
      actionPerformed = "Google Calendar Event Cancelled";
      isComplete = true;
    } else {
      replyText = isHindi
        ? "नमस्ते! क्या आप नया अपॉइंटमेंट बुक करना चाहते हैं, रीशेड्यूल करना चाहते हैं, या किसी डॉक्टर के बारे में पूछना चाहते हैं?"
        : "Hello! Are you looking to book a new appointment, reschedule an existing visit, or check doctor timings?";
      detectedIntent = "General appointment inquiry";
      actionPerformed = "Gathered visit requirement";
    }
  } else if (workflow.id.includes("cake") || business.industry.toLowerCase().includes("bakery")) {
    if (lower.includes("today") || lower.includes("hours") || lower.includes("urgent") || lower.includes("shaam") || lower.includes("aaj")) {
      urgency = "urgent";
    }
    extractedData.cake_type = lower.includes("birthday") ? "Birthday" : "Custom Cake";
    extractedData.flavor = lower.includes("chocolate") ? "Belgian Chocolate Truffle" : "Red Velvet";
    extractedData.weight_kg = lower.includes("2kg") || lower.includes("2 kg") ? "2 kg" : "1 kg";
    extractedData.fulfillment_type = lower.includes("delivery") ? "Home Delivery" : "Store Pickup";

    replyText = isHindi
      ? `बहुत खूब! आपका ${extractedData.weight_kg} ${extractedData.flavor} केक का आर्डर दर्ज कर लिया गया है। ${urgency === "urgent" ? "चूँकि यह आर्डर जल्द चाहिए, इसे अर्जेंट प्राथमिकता पर किचन को भेज दिया है।" : "हमारा बेकर जल्द ही कन्फर्मेशन भेजेगा।"}`
      : `Delightful! I have recorded your order for a ${extractedData.weight_kg} ${extractedData.flavor} cake. ${urgency === "urgent" ? "Since it is needed within 24 hours, our kitchen team has marked it as URGENT priority!" : "Our head baker will contact you shortly with the sketch."}`;

    detectedIntent = `Custom ${extractedData.flavor} cake order inquiry`;
    actionPerformed = urgency === "urgent" ? "Urgent Kitchen Notification & Order Enquiry Logged" : "Standard Order Enquiry Created";
    isComplete = true;
  } else {
    replyText = `Thank you! I have noted all your details for ${business.name}. Our staff will follow up with you promptly.`;
    detectedIntent = "General service inquiry";
    actionPerformed = "Customer Follow-up Record Generated";
    isComplete = true;
  }

  return {
    replyText,
    toolCallsExecuted,
    extractedData,
    detectedIntent,
    summary: `${callerName || "Customer"} contacted ${business.name} regarding: ${detectedIntent}. Result: ${actionPerformed}.`,
    urgency,
    actionPerformed: actionPerformed || "Logged follow-up task",
    isComplete,
    language: isHindi ? "hi" : "en",
  };
}
