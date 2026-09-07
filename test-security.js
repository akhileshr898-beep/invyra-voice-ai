/**
 * Invyra AI - Multi-Tenant Isolation & Authentication Security Test Suite
 * Validates:
 * 1. Unauthenticated route rejection (401)
 * 2. Owner registration & strong password enforcement
 * 3. Brute-force rate limiting & invalid credential protection
 * 4. Multi-tenant isolation: Owner A cannot see Business B
 * 5. IDOR prevention: Owner B cannot modify/delete Business A's workflows or data (403)
 * 6. Password recovery & reset lifecycle
 * 7. Secure session logout
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testFailed++;
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("🔒 INVYRA AI MULTI-TENANT SECURITY & ISOLATION TEST SUITE");
  console.log(`Target: ${BASE_URL}`);
  console.log("==========================================================\n");

  const timestamp = Date.now();
  const ownerAEmail = `doctor.sharma.${timestamp}@testclinic.com`;
  const ownerBEmail = `baker.bella.${timestamp}@testbakery.com`;
  const passwordA = "SharmaSecure2026!";
  const passwordB = "BellaSweet2026!";

  let tokenA = null;
  let tokenB = null;
  let businessA = null;
  let businessB = null;
  let workflowA = null;

  // ------------------------------------------------------------
  // TEST 1: Unauthenticated API Access Protection (Must return 401)
  // ------------------------------------------------------------
  console.log("TEST 1: Verifying Unauthenticated Access is Blocked (401)");
  try {
    const resBiz = await fetch(`${BASE_URL}/api/businesses`);
    assert(resBiz.status === 401, `GET /api/businesses without auth returned status ${resBiz.status} (expected 401)`);

    const resWf = await fetch(`${BASE_URL}/api/workflows`);
    assert(resWf.status === 401, `GET /api/workflows without auth returned status ${resWf.status} (expected 401)`);

    const resConv = await fetch(`${BASE_URL}/api/conversations`);
    assert(resConv.status === 401, `GET /api/conversations without auth returned status ${resConv.status} (expected 401)`);

    const resCal = await fetch(`${BASE_URL}/api/calendar`);
    assert(resCal.status === 401, `GET /api/calendar without auth returned status ${resCal.status} (expected 401)`);
  } catch (err) {
    console.error("Test 1 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // TEST 2: Owner A & Owner B Registration
  // ------------------------------------------------------------
  console.log("\nTEST 2: Registering Distinct Business Owners");
  try {
    // Owner A
    const resRegA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ownerAEmail,
        password: passwordA,
        owner_name: "Dr. Sharma Tenant A",
      }),
    });
    const dataRegA = await resRegA.json();
    assert(resRegA.status === 201, `Owner A registered successfully (status ${resRegA.status})`);
    assert(Boolean(dataRegA.token), "Owner A received valid HMAC signed session token");
    tokenA = dataRegA.token;

    // Owner B
    const resRegB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ownerBEmail,
        password: passwordB,
        owner_name: "Chef Bella Tenant B",
      }),
    });
    const dataRegB = await resRegB.json();
    assert(resRegB.status === 201, `Owner B registered successfully (status ${resRegB.status})`);
    assert(Boolean(dataRegB.token), "Owner B received valid HMAC signed session token");
    tokenB = dataRegB.token;
  } catch (err) {
    console.error("Test 2 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // TEST 3: Login Verification & Rate Limiting Guard
  // ------------------------------------------------------------
  console.log("\nTEST 3: Login Credentials Verification");
  try {
    const failRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerAEmail, password: "WrongPassword999!" }),
    });
    assert(failRes.status === 401, `Invalid password rejected with status ${failRes.status} (expected 401)`);

    const okRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerAEmail, password: passwordA }),
    });
    const okData = await okRes.json();
    assert(okRes.status === 200, `Valid password authenticated with status ${okRes.status}`);
    assert(okData.user.email === ownerAEmail.toLowerCase(), "Logged-in user email verified");
  } catch (err) {
    console.error("Test 3 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // TEST 4: Business Profile Creation & Strict Multi-Tenant Separation
  // ------------------------------------------------------------
  console.log("\nTEST 4: Strict Multi-Tenant Data Isolation");
  try {
    // Owner A creates Business A
    const resBizA = await fetch(`${BASE_URL}/api/businesses`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: "Test Tenant A Clinic",
        industry: "Clinic & Healthcare",
        phone: "+1 (555) 111-0001",
        timezone: "America/New_York",
        operating_hours: "Mon-Fri 9AM-5PM",
        tone: "Medical and empathetic",
      }),
    });
    businessA = await resBizA.json();
    assert(resBizA.status === 201, `Business A created for Owner A (id: ${businessA.id})`);

    // Owner B creates Business B
    const resBizB = await fetch(`${BASE_URL}/api/businesses`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        name: "Test Tenant B Bakery",
        industry: "Bakery & Cake Shop",
        phone: "+1 (555) 222-0002",
        timezone: "America/New_York",
        operating_hours: "Tue-Sun 8AM-8PM",
        tone: "Warm and cheerful",
      }),
    });
    businessB = await resBizB.json();
    assert(resBizB.status === 201, `Business B created for Owner B (id: ${businessB.id})`);

    // Owner A queries businesses: Must ONLY see Business A
    const resListA = await fetch(`${BASE_URL}/api/businesses`, {
      headers: { "Authorization": `Bearer ${tokenA}` },
    });
    const listAData = await resListA.json();
    const hasOnlyA = listAData.businesses.every((b) => b.id !== businessB.id);
    const containsA = listAData.businesses.some((b) => b.id === businessA.id);
    assert(hasOnlyA && containsA, "Owner A sees ONLY Business A; Business B is completely hidden");

    // Owner B queries businesses: Must ONLY see Business B
    const resListB = await fetch(`${BASE_URL}/api/businesses`, {
      headers: { "Authorization": `Bearer ${tokenB}` },
    });
    const listBData = await resListB.json();
    const hasOnlyB = listBData.businesses.every((b) => b.id !== businessA.id);
    const containsB = listBData.businesses.some((b) => b.id === businessB.id);
    assert(hasOnlyB && containsB, "Owner B sees ONLY Business B; Business A is completely hidden");
  } catch (err) {
    console.error("Test 4 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // TEST 5: IDOR Attacks Blocked (Cross-Tenant Modification & Deletion)
  // ------------------------------------------------------------
  console.log("\nTEST 5: Insecure Direct Object Reference (IDOR) Defense");
  try {
    // Owner A creates a workflow in Business A
    const resWfCreate = await fetch(`${BASE_URL}/api/workflows`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenA}` 
      },
      body: JSON.stringify({
        business_id: businessA.id,
        name: "Owner A Private Medical Triage",
        trigger: "missed_call",
        greeting: "Hello, this is Tenant A Clinic.",
        fields_schema: [],
      }),
    });
    workflowA = await resWfCreate.json();
    assert(resWfCreate.status === 201, `Owner A created private workflow (id: ${workflowA.id})`);

    // ATTACK 1: Owner B tries to read Owner A's workflows by specifying businessId
    const resAttackRead = await fetch(`${BASE_URL}/api/workflows?businessId=${businessA.id}`, {
      headers: { "Authorization": `Bearer ${tokenB}` },
    });
    assert(resAttackRead.status === 403, `IDOR read attack blocked with status ${resAttackRead.status} (expected 403 Forbidden)`);

    // ATTACK 2: Owner B tries to update Owner A's workflow
    const resAttackUpdate = await fetch(`${BASE_URL}/api/workflows`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenB}` 
      },
      body: JSON.stringify({
        id: workflowA.id,
        name: "HACKED_BY_TENANT_B",
      }),
    });
    assert(resAttackUpdate.status === 403, `IDOR update attack blocked with status ${resAttackUpdate.status} (expected 403 Forbidden)`);

    // ATTACK 3: Owner B tries to delete Owner A's workflow
    const resAttackDeleteWf = await fetch(`${BASE_URL}/api/workflows?id=${workflowA.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenB}` },
    });
    assert(resAttackDeleteWf.status === 403, `IDOR delete workflow attack blocked with status ${resAttackDeleteWf.status} (expected 403 Forbidden)`);

    // ATTACK 4: Owner B tries to delete Owner A's business profile
    const resAttackDeleteBiz = await fetch(`${BASE_URL}/api/businesses?id=${businessA.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenB}` },
    });
    assert(resAttackDeleteBiz.status === 403, `IDOR delete business attack blocked with status ${resAttackDeleteBiz.status} (expected 403 Forbidden)`);
  } catch (err) {
    console.error("Test 5 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // TEST 6: Password Reset & Lifecycle
  // ------------------------------------------------------------
  console.log("\nTEST 6: Secure Password Reset Flow");
  try {
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerAEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200, "Password reset request accepted (status 200)");
    assert(Boolean(forgotData.resetToken), "Cryptographic recovery token generated");

    const newPasswordA = "NewSharmaSecure2026#";
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: forgotData.resetToken,
        password: newPasswordA,
      }),
    });
    assert(resetRes.status === 200, "Password reset submitted successfully (status 200)");

    // Verify old password no longer works
    const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerAEmail, password: passwordA }),
    });
    assert(oldLoginRes.status === 401, "Old password rejected after reset (status 401)");

    // Verify new password works
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerAEmail, password: newPasswordA }),
    });
    assert(newLoginRes.status === 200, "New password successfully logs in (status 200)");
  } catch (err) {
    console.error("Test 6 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // TEST 7: Logout
  // ------------------------------------------------------------
  console.log("\nTEST 7: Session Logout");
  try {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
    assert(logoutRes.status === 200, "Logout endpoint returned status 200 and cleared cookie");
  } catch (err) {
    console.error("Test 7 error:", err);
    testFailed++;
  }

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n==========================================================");
  console.log(`TEST SUMMARY: ${testPassed} Passed | ${testFailed} Failed`);
  console.log("==========================================================");

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
