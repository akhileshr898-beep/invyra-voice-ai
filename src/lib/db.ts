import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "./supabase";
import { 
  Business, 
  Workflow, 
  ConversationRecord, 
  CalendarEvent 
} from "./types";
import { 
  INITIAL_BUSINESSES, 
  INITIAL_WORKFLOWS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_CALENDAR_EVENTS 
} from "./seed-data";

const STORE_PATH = path.join(process.cwd(), "src", "data", "store.json");

interface DataStore {
  businesses: Business[];
  workflows: Workflow[];
  conversations: ConversationRecord[];
  calendar_events: CalendarEvent[];
}

function ensureLocalStore(): DataStore {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initial: DataStore = {
        businesses: INITIAL_BUSINESSES,
        workflows: INITIAL_WORKFLOWS,
        conversations: INITIAL_CONVERSATIONS,
        calendar_events: INITIAL_CALENDAR_EVENTS,
      };
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const data = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(data) as DataStore;
  } catch (err) {
    console.error("Error reading local store, fallback to memory:", err);
    return {
      businesses: INITIAL_BUSINESSES,
      workflows: INITIAL_WORKFLOWS,
      conversations: INITIAL_CONVERSATIONS,
      calendar_events: INITIAL_CALENDAR_EVENTS,
    };
  }
}

function saveLocalStore(store: DataStore): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local store:", err);
  }
}

// ---------------- BUSINESSES ----------------

export async function getBusinesses(): Promise<Business[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) return data as Business[];
  }
  const store = ensureLocalStore();
  return store.businesses;
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const businesses = await getBusinesses();
  return businesses.find((b) => b.id === id) || null;
}

export async function createBusiness(data: Omit<Business, "id" | "created_at">): Promise<Business> {
  const newBusiness: Business = {
    ...data,
    id: `b-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from("businesses")
      .insert(newBusiness)
      .select()
      .single();
    if (!error && inserted) return inserted as Business;
  }

  const store = ensureLocalStore();
  store.businesses.unshift(newBusiness);
  saveLocalStore(store);
  return newBusiness;
}

export async function deleteBusiness(id: string): Promise<{ success: boolean; message?: string }> {
  const store = ensureLocalStore();
  if (store.businesses.length <= 1) {
    throw new Error("Cannot remove the last remaining business profile. At least one profile is required.");
  }

  if (isSupabaseConfigured && supabase) {
    await supabase.from("workflows").delete().eq("business_id", id);
    await supabase.from("conversations").delete().eq("business_id", id);
    const { error } = await supabase.from("businesses").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete business from Supabase: ${error.message}`);
    }
  }

  store.businesses = store.businesses.filter((b) => b.id !== id);
  store.workflows = store.workflows.filter((w) => w.business_id !== id);
  store.conversations = store.conversations.filter((c) => c.business_id !== id);
  saveLocalStore(store);

  return { success: true };
}

// ---------------- WORKFLOWS ----------------

export async function getWorkflows(businessId?: string): Promise<Workflow[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("workflows").select("*").order("created_at", { ascending: false });
    if (businessId) {
      query = query.eq("business_id", businessId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data as Workflow[];
  }

  const store = ensureLocalStore();
  if (businessId) {
    return store.workflows.filter((w) => w.business_id === businessId);
  }
  return store.workflows;
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflows = await getWorkflows();
  return workflows.find((w) => w.id === id) || null;
}

export async function createWorkflow(data: Omit<Workflow, "id" | "created_at">): Promise<Workflow> {
  const newWorkflow: Workflow = {
    ...data,
    id: `wf-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from("workflows")
      .insert(newWorkflow)
      .select()
      .single();
    if (!error && inserted) return inserted as Workflow;
  }

  const store = ensureLocalStore();
  store.workflows.unshift(newWorkflow);
  saveLocalStore(store);
  return newWorkflow;
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("workflows")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) return data as Workflow;
  }

  const store = ensureLocalStore();
  const index = store.workflows.findIndex((w) => w.id === id);
  if (index === -1) return null;
  store.workflows[index] = { ...store.workflows[index], ...updates };
  saveLocalStore(store);
  return store.workflows[index];
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("workflows").delete().eq("id", id);
    if (!error) return true;
  }

  const store = ensureLocalStore();
  const initialLen = store.workflows.length;
  store.workflows = store.workflows.filter((w) => w.id !== id);
  saveLocalStore(store);
  return store.workflows.length < initialLen;
}

// ---------------- CONVERSATIONS / RECORDS ----------------

export async function getConversations(businessId?: string, followUp?: string): Promise<ConversationRecord[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("customer_conversations").select("*").order("created_at", { ascending: false });
    if (businessId) query = query.eq("business_id", businessId);
    if (followUp && followUp !== "all") query = query.eq("follow_up_status", followUp);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data as ConversationRecord[];
  }

  const store = ensureLocalStore();
  let list = store.conversations;
  if (businessId) list = list.filter((c) => c.business_id === businessId);
  if (followUp && followUp !== "all") list = list.filter((c) => c.follow_up_status === followUp);
  return list;
}

export async function getConversationById(id: string): Promise<ConversationRecord | null> {
  const store = ensureLocalStore();
  return store.conversations.find((c) => c.id === id) || null;
}

export async function createConversation(data: Omit<ConversationRecord, "id" | "created_at" | "updated_at">): Promise<ConversationRecord> {
  const now = new Date().toISOString();
  const newConv: ConversationRecord = {
    ...data,
    id: `conv-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from("customer_conversations")
      .insert(newConv)
      .select()
      .single();
    if (!error && inserted) return inserted as ConversationRecord;
  }

  const store = ensureLocalStore();
  store.conversations.unshift(newConv);
  saveLocalStore(store);
  return newConv;
}

export async function updateConversationStatus(
  id: string, 
  followUpStatus: "pending" | "contacted" | "completed" | "closed"
): Promise<ConversationRecord | null> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("customer_conversations")
      .update({ follow_up_status: followUpStatus, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) return data as ConversationRecord;
  }

  const store = ensureLocalStore();
  const index = store.conversations.findIndex((c) => c.id === id);
  if (index === -1) return null;
  store.conversations[index] = {
    ...store.conversations[index],
    follow_up_status: followUpStatus,
    updated_at: now,
  };
  saveLocalStore(store);
  return store.conversations[index];
}

// ---------------- CALENDAR EVENTS ----------------

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_time", { ascending: true });
    if (!error && data && data.length > 0) return data as CalendarEvent[];
  }

  const store = ensureLocalStore();
  return store.calendar_events;
}

export async function createCalendarEvent(data: Omit<CalendarEvent, "id" | "created_at">): Promise<CalendarEvent> {
  const newEvent: CalendarEvent = {
    ...data,
    id: `cal-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from("calendar_events")
      .insert(newEvent)
      .select()
      .single();
    if (!error && inserted) return inserted as CalendarEvent;
  }

  const store = ensureLocalStore();
  store.calendar_events.push(newEvent);
  saveLocalStore(store);
  return newEvent;
}

export async function rescheduleCalendarEvent(
  idOrKeyword: string,
  newStartTime: string,
  newEndTime: string,
  notes?: string
): Promise<CalendarEvent | null> {
  const store = ensureLocalStore();
  const event = store.calendar_events.find(
    (e) => e.id === idOrKeyword || e.attendee_name.toLowerCase().includes(idOrKeyword.toLowerCase())
  );
  if (!event) return null;

  event.start_time = newStartTime;
  event.end_time = newEndTime;
  event.status = "rescheduled";
  if (notes) event.notes = (event.notes ? event.notes + " | " : "") + notes;

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("calendar_events")
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        status: "rescheduled",
        notes: event.notes,
      })
      .eq("id", event.id);
  }

  saveLocalStore(store);
  return event;
}

export async function cancelCalendarEvent(idOrKeyword: string, reason?: string): Promise<CalendarEvent | null> {
  const store = ensureLocalStore();
  const event = store.calendar_events.find(
    (e) => e.id === idOrKeyword || e.attendee_name.toLowerCase().includes(idOrKeyword.toLowerCase())
  );
  if (!event) return null;

  event.status = "cancelled";
  if (reason) event.notes = (event.notes ? event.notes + " | " : "") + `Cancelled: ${reason}`;

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("calendar_events")
      .update({ status: "cancelled", notes: event.notes })
      .eq("id", event.id);
  }

  saveLocalStore(store);
  return event;
}
