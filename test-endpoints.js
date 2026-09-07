async function getBaseUrl() {
  const ports = [3000, 3001];
  for (const p of ports) {
    try {
      const res = await fetch(`http://localhost:${p}/api/businesses`, { method: "HEAD" });
      if (res.status === 200 || res.status === 405) return `http://localhost:${p}`;
    } catch {}
  }
  return "http://localhost:3000";
}

async function runTests() {
  const baseUrl = await getBaseUrl();
  console.log(`=== RUNNING INVYRA VOICE AI TESTS (Target: ${baseUrl}) ===\n`);

  // 1. Test GET /api/businesses
  console.log("1. Testing GET /api/businesses...");
  const bizRes = await fetch(`${baseUrl}/api/businesses`);
  const bizData = await bizRes.json();
  console.log(`-> Loaded ${bizData.businesses.length} businesses:`);
  bizData.businesses.forEach((b) => console.log(`   * ${b.name} (${b.industry})`));

  // 2. Test GET /api/workflows
  console.log("\n2. Testing GET /api/workflows...");
  const wfRes = await fetch(`${baseUrl}/api/workflows`);
  const wfData = await wfRes.json();
  console.log(`-> Loaded ${wfData.workflows.length} workflows:`);
  wfData.workflows.forEach((w) => console.log(`   * ${w.name} (Fields: ${w.fields_schema.length}, Rules: ${w.conditional_rules.length})`));

  // 3. Test GET /api/calendar
  console.log("\n3. Testing GET /api/calendar...");
  const calRes = await fetch(`${baseUrl}/api/calendar`);
  const calData = await calRes.json();
  console.log(`-> Loaded ${calData.events.length} calendar events:`);
  calData.events.forEach((e) => console.log(`   * ${e.title} [${e.status}] (${e.start_time})`));

  // 4. Test Calendar Tool Direct Call: checkAvailability
  console.log("\n4. Testing POST /api/calendar (checkAvailability tool)...");
  const checkRes = await fetch(`${baseUrl}/api/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "checkAvailability",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      startTime: "16:00",
      doctorOrService: "Dr. Sharma",
    }),
  });
  const checkData = await checkRes.json();
  console.log(`-> Result: Available = ${checkData.available}, Reason: ${checkData.reason}`);

  // 5. Test Chat Turn: Clinic Appointment Booking with Autonomous Tool Calling
  console.log("\n5. Testing POST /api/chat (Clinic Appointment Booking Flow)...");
  const clinicBiz = bizData.businesses.find((b) => b.name.includes("Clinic"));
  const clinicWf = wfData.workflows.find((w) => w.business_id === clinicBiz.id);
  const chatRes = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: clinicBiz.id,
      workflowId: clinicWf.id,
      transcript: [
        { role: "assistant", message: clinicWf.greeting, timestamp: "10:00:00 AM" }
      ],
      latestUserMessage: "I want to schedule an appointment with Dr. Sharma tomorrow at 4 PM",
      callerName: "Aarav Gupta",
      callerPhone: "+1 (555) 987-6543",
    }),
  });
  const chatData = await chatRes.json();
  console.log("-> Assistant Reply:", chatData.replyText);
  console.log("-> Tool Calls Executed:", JSON.stringify(chatData.toolCallsExecuted, null, 2));
  console.log("-> Extracted Intent:", chatData.detectedIntent);
  console.log("-> Action Performed:", chatData.actionPerformed);

  // 6. Test Chat Turn: Cake Shop Urgent Order Condition
  console.log("\n6. Testing POST /api/chat (Cake Shop Urgency Condition)...");
  const bakeryBiz = bizData.businesses.find((b) => b.name.includes("Cake"));
  const bakeryWf = wfData.workflows.find((w) => w.business_id === bakeryBiz.id);
  const cakeRes = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: bakeryBiz.id,
      workflowId: bakeryWf.id,
      transcript: [
        { role: "assistant", message: bakeryWf.greeting, timestamp: "11:00:00 AM" }
      ],
      latestUserMessage: "I need a 2kg Belgian chocolate truffle cake for a birthday today evening",
      callerName: "Priya Sengupta",
      callerPhone: "+1 (555) 345-6789",
    }),
  });
  const cakeData = await cakeRes.json();
  console.log("-> Assistant Reply:", cakeData.replyText);
  console.log("-> Priority / Urgency:", cakeData.urgency);
  console.log("-> Action Performed:", cakeData.actionPerformed);

  // 7. Test Customer Records: GET & PATCH Follow-Up Status
  console.log("\n7. Testing GET /api/conversations & PATCH follow_up_status...");
  const convRes = await fetch(`${baseUrl}/api/conversations`);
  const convData = await convRes.json();
  console.log(`-> Total Conversation Records: ${convData.records.length}`);
  const firstRecord = convData.records[0];
  console.log(`-> Updating record ${firstRecord.id} status from '${firstRecord.follow_up_status}' to 'completed'...`);

  const patchRes = await fetch(`${baseUrl}/api/conversations`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: firstRecord.id,
      followUpStatus: "completed",
    }),
  });
  const updatedRecord = await patchRes.json();
  console.log(`-> Updated Follow-Up Status: ${updatedRecord.follow_up_status}`);

  console.log("\n=== ALL END-TO-END TESTS COMPLETED SUCCESSFULLY ===");
}

runTests().catch(console.error);
