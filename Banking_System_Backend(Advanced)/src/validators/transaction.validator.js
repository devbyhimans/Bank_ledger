const { z } = require("zod");

// Validates a MongoDB ObjectId string
const mongoId = z
  .string({ required_error: "Account ID is required" })
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const createTransactionSchema = z.object({
  fromAccount: mongoId.describe("Sender's account ID"),

  toAccount: mongoId.describe("Receiver's account ID"),

  amount: z
    .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .finite("Amount must be a finite number")
    .max(10_000_000, "Amount cannot exceed 10,000,000"),

  idempotencyKey: z
    .string({ required_error: "Idempotency key is required" })
    .trim()
    .min(1, "Idempotency key cannot be empty")
    .max(128, "Idempotency key cannot exceed 128 characters"),
});

const initialFundsSchema = z.object({
  toAccount: mongoId.describe("Target account ID to credit"),

  amount: z
    .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .finite("Amount must be a finite number")
    .max(100_000_000, "Initial funds cannot exceed 100,000,000"),

  idempotencyKey: z
    .string({ required_error: "Idempotency key is required" })
    .trim()
    .min(1, "Idempotency key cannot be empty")
    .max(128, "Idempotency key cannot exceed 128 characters"),
});

module.exports = { createTransactionSchema, initialFundsSchema };
