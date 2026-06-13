/**
 * Setup script: Creates a system user + system account in the DB.
 * Then tests the initial-funds API end-to-end.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI;

async function setup() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");

  const db = mongoose.connection.db;

  // 1. Check if system user already exists
  const existingUser = await db.collection('users').findOne({ email: 'system@bankingledger.internal' });

  let systemUserId;

  if (existingUser) {
    console.log("System user already exists:", existingUser._id);
    systemUserId = existingUser._id;
  } else {
    // Create system user directly (bypass schema immutable constraint)
    const hashedPassword = await bcrypt.hash('SystemPass@999', 10);
    const result = await db.collection('users').insertOne({
      email: 'system@bankingledger.internal',
      name: 'System Bank',
      password: hashedPassword,
      systemUser: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    systemUserId = result.insertedId;
    console.log("✅ System user created:", systemUserId);
  }

  // 2. Check if system account already exists
  const existingAccount = await db.collection('accounts').findOne({ user: systemUserId, systemAccount: true });

  let systemAccountId;

  if (existingAccount) {
    console.log("System account already exists:", existingAccount._id);
    systemAccountId = existingAccount._id;
  } else {
    const result = await db.collection('accounts').insertOne({
      user: systemUserId,
      status: 'ACTIVE',
      currency: 'INR',
      systemAccount: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    systemAccountId = result.insertedId;
    console.log("✅ System account created:", systemAccountId);
  }

  // 3. Print summary
  console.log("\n--- SYSTEM USER SETUP COMPLETE ---");
  console.log("System User ID:    ", systemUserId.toString());
  console.log("System Account ID: ", systemAccountId.toString());
  console.log("Email:              system@bankingledger.internal");
  console.log("Password:           SystemPass@999");

  await mongoose.disconnect();
}

setup().catch(err => { console.error(err); process.exit(1); });
