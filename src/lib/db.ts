import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "./supabase";
import { 
  Business, 
  Workflow, 
  ConversationRecord, 
  CalendarEvent,
  User 
} from "./types";
import { 
  INITIAL_USERS,
  INITIAL_BUSINESSES, 
  INITIAL_WORKFLOWS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_CALENDAR_EVENTS 
} from "./seed-data";

const STORE_PATH = path.join(process.cwd(), "src", "data", "store.json");

interface DataStore {
  users: User[];
  businesses: Business[];
  workflows: Workflow[];
  conversations: ConversationRecord[];
  calendar_events: CalendarEvent[];
}

function ensureLocalStore(): DataStore {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initial: DataStore = {
        users: INITIAL_USERS,
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
    const store = JSON.parse(data) as Partial<DataStore>;
    let modified = false;

    // 1. Ensure users array
    if (!store.users || store.users.length === 0) {
      store.users = [...INITIAL_USERS];
      modified = true;
    } else {
      // Ensure initial demo users exist
      for (const initUser of INITIAL_USERS) {
        if (!store.users.some(u => u.email.toLowerCase() === initUser.email.toLowerCase())) {
          store.users.push(initUser);
          modified = true;
        }
      }
    }

    // 2. Ensure businesses have owner_user_id & complete metadata
    if (!store.businesses) {
      store.businesses = [...INITIAL_BUSINESSES];
      modified = true;
    } else {
      const ownerMap: Record<string, { owner_user_id: string; owner_name: string; email: string; business_address: string; preferred_language: string; google_calendar_connected: boolean }> = {
        "b-clinic-001": {
          owner_user_id: "u-clinic-sharma",
          owner_name: "Dr. Aryan Sharma",
          email: "dr.sharma@apexclinic.com",
          business_address: "742 Evergreen Terrace, Suite 100, New York, NY",
          preferred_language: "English & Hindi",
          google_calendar_connected: true,
        },
        "b-bakery-002": {
          owner_user_id: "u-bakery-bella",
          owner_name: "Chef Bella Rossi",
          email: "chef.bella@sweetdelights.com",
          business_address: "128 Baker St, New York, NY",
          preferred_language: "English",
          google_calendar_connected: false,
        },
        "b-logistics-003": {
          owner_user_id: "u-logistics-marcus",
          owner_name: "Marcus Vance",
          email: "dispatch@swiftlogistics.com",
          business_address: "500 Harbor Blvd, Port Newark, NJ",
          preferred_language: "English",
          google_calendar_connected: false,
        },
      };

      for (const b of store.businesses) {
        if (!b.owner_user_id) {
          const mapping = ownerMap[b.id];
          if (mapping) {
            b.owner_user_id = mapping.owner_user_id;
            b.owner_name = b.owner_name || mapping.owner_name;
            b.email = b.email || mapping.email;
            b.business_address = b.business_address || mapping.business_address;
            b.preferred_language = b.preferred_language || mapping.preferred_language;
            b.google_calendar_connected = b.google_calendar_connected ?? mapping.google_calendar_connected;
          } else {
            b.owner_user_id = "u-clinic-sharma";
          }
          modified = true;
        }
      }
    }

    // 3. Ensure workflows array
    if (!store.workflows) {
      store.workflows = [...INITIAL_WORKFLOWS];
      modified = true;
    }

    // 4. Ensure conversations array
    if (!store.conversations) {
      store.conversations = [...INITIAL_CONVERSATIONS];
      modified = true;
    }

    // 5. Ensure calendar events have business_id
    if (!store.calendar_events) {
      store.calendar_events = [...INITIAL_CALENDAR_EVENTS];
      modified = true;
    } else {
      for (const event of store.calendar_events) {
        if (!event.business_id) {
          event.business_id = "b-clinic-001";
          modified = true;
        }
      }
    }

    if (modified) {
      saveLocalStore(store as DataStore);
    }

    return store as DataStore;
  } catch (err) {
    console.error("Error reading local store, fallback to memory:", err);
    return {
      users: INITIAL_USERS,
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

// ---------------- USERS (AUTH) ----------------

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (!error && data) return data as User;
  }

  const store = ensureLocalStore();
  return store.users.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return data as User;
  }

  const store = ensureLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function createUser(data: Omit<User, "id" | "created_at">): Promise<User> {
  const newUser: User = {
    ...data,
    email: data.email.toLowerCase().trim(),
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from("users")
      .insert(newUser)
      .select()
      .single();
    if (!error && inserted) return inserted as User;
  }

  const store = ensureLocalStore();
  store.users.push(newUser);
  saveLocalStore(store);
  return newUser;
}

export async function updateUserPassword(id: string, password_hash: string, salt: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("users")
      .update({
        password_hash,
        salt,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq("id", id);
    if (!error) return true;
  }

  const store = ensureLocalStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return false;
  user.password_hash = password_hash;
  user.salt = salt;
  user.reset_token = undefined;
  user.reset_token_expiry = undefined;
  saveLocalStore(store);
  return true;
}

export async function setResetToken(email: string, token: string, expiryTimestamp: number): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("users")
      .update({
        reset_token: token,
        reset_token_expiry: expiryTimestamp,
      })
      .eq("email", normalizedEmail);
    if (!error) return true;
  }

  const store = ensureLocalStore();
  const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) return false;
  user.reset_token = token;
  user.reset_token_expiry = expiryTimestamp;
  saveLocalStore(store);
  return true;
}

export async function getUserByResetToken(token: string): Promise<User | null> {
  const now = Date.now();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("reset_token", token)
      .gt("reset_token_expiry", now)
      .maybeSingle();
    if (!error && data) return data as User;
  }

  const store = ensureLocalStore();
  return store.users.find((u) => u.reset_token === token && (u.reset_token_expiry || 0) > now) || null;
}

// ---------------- BUSINESSES (TENANT ISOLATED) ----------------

export async function getBusinesses(ownerUserId?: string): Promise<Business[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });
    if (ownerUserId) {
      query = query.eq("owner_user_id", ownerUserId);
    }
    const { data, error } = await query;
    if (!error && data) return data as Business[];
  }
  const store = ensureLocalStore();
  if (ownerUserId) {
    return store.businesses.filter((b) => b.owner_user_id === ownerUserId);
  }
  return store.businesses;
}

export async function getBusinessById(id: string, ownerUserId?: string): Promise<Business | null> {
  const businesses = await getBusinesses(ownerUserId);
  return businesses.find((b) => b.id === id) || null;
}

export async function createBusiness(data: Omit<Business, "id" | "created_at">): Promise<Business> {
  const newBusiness: Business = {
    ...data,
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

export async function deleteBusiness(id: string, ownerUserId?: string): Promise<{ success: boolean; message?: string }> {
  const store = ensureLocalStore();
  const business = store.businesses.find((b) => b.id === id);
  if (!business) {
    throw new Error("Business not found.");
  }

  // Tenant security: verify ownership if ownerUserId is provided
  if (ownerUserId && business.owner_user_id !== ownerUserId) {
    throw new Error("Forbidden: You do not have permission to delete this business.");
  }

  // Check if owner has more than one business
  const ownerBusinesses = store.businesses.filter((b) => b.owner_user_id === business.owner_user_id);
  if (ownerBusinesses.length <= 1) {
    throw new Error("Cannot remove the last remaining business profile for this account. At least one profile is required.");
  }

  if (isSupabaseConfigured && supabase) {
    await supabase.from("workflows").delete().eq("business_id", id);
    await supabase.from("customer_conversations").delete().eq("business_id", id);
    await supabase.from("calendar_events").delete().eq("business_id", id);
    const { error } = await supabase.from("businesses").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete business from Supabase: ${error.message}`);
    }
  }

  store.businesses = store.businesses.filter((b) => b.id !== id);
  store.workflows = store.workflows.filter((w) => w.business_id !== id);
  store.conversations = store.conversations.filter((c) => c.business_id !== id);
  store.calendar_events = store.calendar_events.filter((e) => e.business_id !== id);
  saveLocalStore(store);

  return { success: true };
}

// ---------------- WORKFLOWS (TENANT ISOLATED) ----------------

export async function getWorkflows(businessId?: string): Promise<Workflow[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("workflows").select("*").order("created_at", { ascending: false });
    if (businessId) {
      query = query.eq("business_id", businessId);
    }
    const { data, error } = await query;
    if (!error && data) return data as Workflow[];
  }

  const store = ensureLocalStore();
  if (businessId) {
    return store.workflows.filter((w) => w.business_id === businessId);
  }
  return store.workflows;
}

export async function getWorkflowById(id: string, businessId?: string): Promise<Workflow | null> {
  const workflows = await getWorkflows(businessId);
  return workflows.find((w) => w.id === id) || null;
}

export async function createWorkflow(data: Omit<Workflow, "id" | "created_at">): Promise<Workflow> {
  const newWorkflow: Workflow = {
    ...data,
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

export async function updateWorkflow(id: string, updates: Partial<Workflow>, businessId?: string): Promise<Workflow | null> {
  const store = ensureLocalStore();
  const existing = store.workflows.find((w) => w.id === id);
  if (!existing) return null;
  if (businessId && existing.business_id !== businessId) {
    throw new Error("Forbidden: You cannot modify a workflow that belongs to another business.");
  }

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("workflows")
      .update(updates)
      .eq("id", id);
    if (businessId) {
      query = query.eq("business_id", businessId);
    }
    const { data, error } = await query.select().single();
    if (!error && data) return data as Workflow;
  }

  const index = store.workflows.findIndex((w) => w.id === id);
  store.workflows[index] = { ...store.workflows[index], ...updates };
  saveLocalStore(store);
  return store.workflows[index];
}

export async function deleteWorkflow(id: string, businessId?: string): Promise<boolean> {
  const store = ensureLocalStore();
  const existing = store.workflows.find((w) => w.id === id);
  if (!existing) return false;
  if (businessId && existing.business_id !== businessId) {
    throw new Error("Forbidden: You cannot delete a workflow that belongs to another business.");
  }

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("workflows").delete().eq("id", id);
    if (businessId) query = query.eq("business_id", businessId);
    const { error } = await query;
    if (!error) return true;
  }

  const initialLen = store.workflows.length;
  store.workflows = store.workflows.filter((w) => w.id !== id);
  saveLocalStore(store);
  return store.workflows.length < initialLen;
}

// ---------------- CONVERSATIONS / RECORDS (TENANT ISOLATED) ----------------

export async function getConversations(businessId?: string, followUp?: string): Promise<ConversationRecord[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("customer_conversations").select("*").order("created_at", { ascending: false });
    if (businessId) query = query.eq("business_id", businessId);
    if (followUp && followUp !== "all") query = query.eq("follow_up_status", followUp);
    const { data, error } = await query;
    if (!error && data) return data as ConversationRecord[];
  }

  const store = ensureLocalStore();
  let list = store.conversations;
  if (businessId) list = list.filter((c) => c.business_id === businessId);
  if (followUp && followUp !== "all") list = list.filter((c) => c.follow_up_status === followUp);
  return list;
}

export async function getConversationById(id: string, businessId?: string): Promise<ConversationRecord | null> {
  const store = ensureLocalStore();
  const conv = store.conversations.find((c) => c.id === id) || null;
  if (conv && businessId && conv.business_id !== businessId) {
    return null;
  }
  return conv;
}

export async function createConversation(data: Omit<ConversationRecord, "id" | "created_at" | "updated_at">): Promise<ConversationRecord> {
  const now = new Date().toISOString();
  const newConv: ConversationRecord = {
    ...data,
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
  followUpStatus: "pending" | "contacted" | "completed" | "closed",
  businessId?: string
): Promise<ConversationRecord | null> {
  const now = new Date().toISOString();
  const store = ensureLocalStore();
  const index = store.conversations.findIndex((c) => c.id === id);
  if (index === -1) return null;
  if (businessId && store.conversations[index].business_id !== businessId) {
    throw new Error("Forbidden: You cannot update a conversation that belongs to another business.");
  }

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("customer_conversations")
      .update({ follow_up_status: followUpStatus, updated_at: now })
      .eq("id", id);
    if (businessId) query = query.eq("business_id", businessId);
    const { data, error } = await query.select().single();
    if (!error && data) return data as ConversationRecord;
  }

  store.conversations[index] = {
    ...store.conversations[index],
    follow_up_status: followUpStatus,
    updated_at: now,
  };
  saveLocalStore(store);
  return store.conversations[index];
}

// ---------------- CALENDAR EVENTS (TENANT ISOLATED) ----------------

export async function getCalendarEvents(businessId?: string): Promise<CalendarEvent[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("calendar_events")
      .select("*")
      .order("start_time", { ascending: true });
    if (businessId) {
      query = query.eq("business_id", businessId);
    }
    const { data, error } = await query;
    if (!error && data) return data as CalendarEvent[];
  }

  const store = ensureLocalStore();
  if (businessId) {
    return store.calendar_events.filter((e) => e.business_id === businessId);
  }
  return store.calendar_events;
}

export async function createCalendarEvent(data: Omit<CalendarEvent, "id" | "created_at">): Promise<CalendarEvent> {
  const newEvent: CalendarEvent = {
    ...data,
    id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
  notes?: string,
  businessId?: string
): Promise<CalendarEvent | null> {
  const store = ensureLocalStore();
  const event = store.calendar_events.find(
    (e) => (e.id === idOrKeyword || e.attendee_name.toLowerCase().includes(idOrKeyword.toLowerCase())) &&
           (!businessId || e.business_id === businessId)
  );
  if (!event) return null;

  event.start_time = newStartTime;
  event.end_time = newEndTime;
  event.status = "rescheduled";
  if (notes) event.notes = (event.notes ? event.notes + " | " : "") + notes;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("calendar_events")
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        status: "rescheduled",
        notes: event.notes,
      })
      .eq("id", event.id);
    if (businessId) query = query.eq("business_id", businessId);
    await query;
  }

  saveLocalStore(store);
  return event;
}

export async function cancelCalendarEvent(idOrKeyword: string, reason?: string, businessId?: string): Promise<CalendarEvent | null> {
  const store = ensureLocalStore();
  const event = store.calendar_events.find(
    (e) => (e.id === idOrKeyword || e.attendee_name.toLowerCase().includes(idOrKeyword.toLowerCase())) &&
           (!businessId || e.business_id === businessId)
  );
  if (!event) return null;

  event.status = "cancelled";
  if (reason) event.notes = (event.notes ? event.notes + " | " : "") + `Cancelled: ${reason}`;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("calendar_events")
      .update({ status: "cancelled", notes: event.notes })
      .eq("id", event.id);
    if (businessId) query = query.eq("business_id", businessId);
    await query;
  }

  saveLocalStore(store);
  return event;
}
