export interface Business {
  id: string;
  name: string;
  industry: string;
  phone: string;
  timezone: string;
  operating_hours: string;
  tone: string;
  created_at: string;
}

export interface WorkflowField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "time" | "select";
  required: boolean;
  promptQuestion: string;
  options?: string[];
}

export interface WorkflowCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "less_than_or_equal_hours" | "greater_than";
  value: string;
  resultUrgency: "normal" | "high" | "urgent";
  resultNote?: string;
}

export interface Workflow {
  id: string;
  business_id: string;
  name: string;
  trigger: "missed_call" | "manual_simulation";
  greeting: string;
  fields_schema: WorkflowField[];
  conditional_rules: WorkflowCondition[];
  action_after_collection: "create_calendar_event" | "create_order_enquiry" | "schedule_callback" | "urgent_dispatch";
  closing_message: string;
  is_active: boolean;
  created_at: string;
}

export interface TranscriptMessage {
  role: "assistant" | "user" | "system";
  message: string;
  timestamp: string;
  tool_call?: {
    name: string;
    args: Record<string, any>;
    result?: Record<string, any>;
  };
}

export interface ConversationRecord {
  id: string;
  business_id: string;
  workflow_id: string;
  business_name?: string;
  workflow_name?: string;
  caller_name: string;
  caller_phone: string;
  status: "in_progress" | "completed" | "failed" | "abandoned";
  intent: string;
  collected_data: Record<string, any>;
  summary: string;
  action_performed: string;
  priority: "normal" | "high" | "urgent";
  follow_up_status: "pending" | "contacted" | "completed" | "closed";
  transcript: TranscriptMessage[];
  language: string; // 'en' | 'hi' | 'bilingual'
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  conversation_id?: string;
  title: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  attendee_name: string;
  attendee_phone: string;
  doctor_or_service?: string;
  notes?: string;
  google_event_id?: string;
  status: "confirmed" | "rescheduled" | "cancelled";
  created_at: string;
}

export interface ToolCallPayload {
  name: string;
  args: Record<string, any>;
}
