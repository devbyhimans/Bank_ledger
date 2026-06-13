/**
 * Test: initial-funds API
 * 1. Login as system user
 * 2. Call POST /api/transactions/system/intial-funds
 * 3. Verify funds landed in target account
 */

const BASE = "http://localhost:3000/api";

async function run() {
  console.log("=".repeat(60));
  console.log("  INITIAL FUNDS API TEST");
  console.log("=".repeat(60));

  // Step 1: Login as system user
  console.log("\n--- STEP 1: LOGIN AS SYSTEM USER ---\n");
  
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "system@bankingledger.internal",
      password: "SystemPass@999",
    }),
  });

  const cookies = loginRes.headers.getSetCookie?.() || [];
  let token = null;
  for (const c of cookies) {
    const match = c.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  const loginData = await loginRes.json();
  console.log(`  Status: ${loginRes.status}`);
  console.log(`  User: ${JSON.stringify(loginData.user)}`);
  console.log(`  Token: ${token ? token.substring(0, 25) + "..." : "MISSING"}`);

  if (!token) {
    console.log("  ❌ Cannot proceed without token");
    return;
  }

  // Step 2: Call initial-funds API with the user's provided details
  console.log("\n--- STEP 2: SEED ₹10,000 TO ACCOUNT ---\n");
  console.log("  Target Account: 6a2d8db5c34f2a4bb63da5d2 (Sneha Gupta)");
  console.log("  Amount: ₹10,000");
  console.log("  Idempotency Key: 019ec1f7-4b28-71f2-b08d-5b2cde7e7b6b");

  const fundRes = await fetch(`${BASE}/transactions/system/intial-funds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      toAccount: "6a2d8db5c34f2a4bb63da5d2",
      amount: 10000,
      idempotencyKey: "019ec1f7-4b28-71f2-b08d-5b2cde7e7b6b",
    }),
  });

  const fundData = await fundRes.json();
  console.log(`\n  Response Status: ${fundRes.status}`);
  console.log(`  Response Body:`, JSON.stringify(fundData, null, 2));

  if (fundRes.status === 201) {
    console.log("\n  ✅ INITIAL FUNDS SEEDED SUCCESSFULLY!");
  } else {
    console.log("\n  ❌ INITIAL FUNDS FAILED");
  }

  // Step 3: Verify — try a transfer FROM Sneha's account now
  console.log("\n--- STEP 3: VERIFY — TRANSFER FROM SNEHA TO AARAV ---\n");

  // Login as Sneha
  const snehaLogin = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "sneha.gupta@gmail.com",
      password: "Sneha@101",
    }),
  });

  const snehaCookies = snehaLogin.headers.getSetCookie?.() || [];
  let snehaToken = null;
  for (const c of snehaCookies) {
    const m = c.match(/token=([^;]+)/);
    if (m) snehaToken = m[1];
  }

  if (!snehaToken) {
    console.log("  ❌ Could not login as Sneha");
    return;
  }

  console.log("  Sneha logged in ✅");

  // Transfer ₹500 from Sneha (6a2d8db5c34f2a4bb63da5d2) → Aarav's account
  // We need Sneha's ACCOUNT id, not user id. Let me find it.
  // Sneha's user ID: 6a2d8db5c34f2a4bb63da5d2  
  // Sneha's account ID: 6a2d8e653fa0ee8be979e4e0 (from earlier test)
  // Aarav's account ID: 6a2d8e643fa0ee8be979e4dd (from earlier test)

  // Wait — the toAccount in initial-funds was Sneha's USER id, not account id!
  // Let me check if it's actually her account id...
  // 6a2d8db5c34f2a4bb63da5d2 is Sneha's USER id from registration.
  // Sneha's ACCOUNT id from account creation was 6a2d8e653fa0ee8be979e4e0.
  // The user passed Sneha's user ID as toAccount — this will be an issue.
  // Let's just check by trying a transfer.

  const txnRes = await fetch(`${BASE}/transactions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${snehaToken}`,
    },
    body: JSON.stringify({
      fromAccount: "6a2d8e653fa0ee8be979e4e0", // Sneha's ACCOUNT id
      toAccount: "6a2d8e643fa0ee8be979e4dd",   // Aarav's ACCOUNT id
      amount: 500,
      idempotencyKey: `verify-transfer-${Date.now()}`,
    }),
  });

  const txnData = await txnRes.json();
  console.log(`  Transfer Status: ${txnRes.status}`);
  console.log(`  Transfer Response:`, JSON.stringify(txnData, null, 2));

  if (txnRes.status === 200) {
    console.log("\n  ✅ TRANSFER SUCCESSFUL — Sneha sent ₹500 to Aarav!");
  } else if (txnData.message?.includes("Insufficient balance")) {
    console.log("\n  ⚠️  Sneha's ACCOUNT has 0 balance — initial funds went to wrong ID");
    console.log("     (The toAccount '6a2d8db5c34f2a4bb63da5d2' is Sneha's USER id, not her ACCOUNT id)");
    console.log("     Sneha's ACCOUNT id is: 6a2d8e653fa0ee8be979e4e0");
    
    // Let's try again with correct account ID
    console.log("\n--- STEP 4: RE-SEED WITH CORRECT ACCOUNT ID ---\n");

    const reFundRes = await fetch(`${BASE}/transactions/system/intial-funds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // system user token
      },
      body: JSON.stringify({
        toAccount: "6a2d8e653fa0ee8be979e4e0", // Sneha's ACCOUNT id
        amount: 10000,
        idempotencyKey: `reseed-${Date.now()}`,
      }),
    });

    const reFundData = await reFundRes.json();
    console.log(`  Re-seed Status: ${reFundRes.status}`);
    console.log(`  Re-seed Response:`, JSON.stringify(reFundData, null, 2));

    if (reFundRes.status === 201) {
      // Now try transfer again
      console.log("\n--- STEP 5: RETRY TRANSFER ---\n");
      const retryRes = await fetch(`${BASE}/transactions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${snehaToken}`,
        },
        body: JSON.stringify({
          fromAccount: "6a2d8e653fa0ee8be979e4e0",
          toAccount: "6a2d8e643fa0ee8be979e4dd",
          amount: 500,
          idempotencyKey: `verify-transfer2-${Date.now()}`,
        }),
      });

      const retryData = await retryRes.json();
      console.log(`  Transfer Status: ${retryRes.status}`);
      console.log(`  Transfer Response:`, JSON.stringify(retryData, null, 2));

      if (retryRes.status === 200) {
        console.log("\n  ✅ FULL FLOW VERIFIED — Initial funds → Transfer works end-to-end!");
      }
    }
  }

  console.log("\n" + "=".repeat(60));
}

run().catch(console.error);
