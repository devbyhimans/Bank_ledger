const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Banking Ledger API",
      version: "1.0.0",
      description: `
## Overview
A production-grade **Banking Ledger System** API implementing **double-entry bookkeeping**.

The ledger is the **single source of truth** — all account balances are derived from CREDIT/DEBIT ledger entries, never stored directly.

## Authentication
Most endpoints require a JWT token. Obtain it by registering or logging in.

Pass the token as:
- **Cookie**: \`token=<jwt>\`
- **Authorization Header**: \`Bearer <jwt>\`

## Idempotency
All transaction endpoints require a unique \`idempotencyKey\` in the request body. This prevents duplicate transfers on network retries.

## System User
The \`POST /api/transactions/system/intial-funds\` endpoint is restricted to the **system user** only. Use the \`setup-system-user.js\` script to create one.
      `.trim(),
      contact: {
        name: "devbyhimans",
        url: "https://github.com/devbyhimans",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from /api/auth/login or /api/auth/register",
        },
      },
      schemas: {
        // ─── Auth ────────────────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 50,
              example: "Himanshu Sharma",
            },
            email: {
              type: "string",
              format: "email",
              example: "himanshu@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "securePass123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "himanshu@example.com",
            },
            password: {
              type: "string",
              example: "securePass123",
            },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            _id: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0d" },
            name: { type: "string", example: "Himanshu Sharma" },
            email: { type: "string", example: "himanshu@example.com" },
          },
        },

        // ─── Account ─────────────────────────────────────────────────
        CreateAccountRequest: {
          type: "object",
          properties: {
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              default: "INR",
              example: "INR",
              description: "3-letter ISO currency code",
            },
          },
        },
        AccountResponse: {
          type: "object",
          properties: {
            _id: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0d" },
            user: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0e" },
            status: {
              type: "string",
              enum: ["ACTIVE", "FROZEN", "CLOSED"],
              example: "ACTIVE",
            },
            currency: { type: "string", example: "INR" },
            systemAccount: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        BalanceResponse: {
          type: "object",
          properties: {
            accountId: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0d" },
            balance: { type: "number", example: 50000 },
          },
        },

        // ─── Transaction ──────────────────────────────────────────────
        CreateTransactionRequest: {
          type: "object",
          required: ["fromAccount", "toAccount", "amount", "idempotencyKey"],
          properties: {
            fromAccount: {
              type: "string",
              description: "MongoDB ObjectId of sender's account",
              example: "665f1a2b3c4d5e6f7a8b9c0d",
            },
            toAccount: {
              type: "string",
              description: "MongoDB ObjectId of receiver's account",
              example: "665f1a2b3c4d5e6f7a8b9c0e",
            },
            amount: {
              type: "number",
              minimum: 0.01,
              maximum: 10000000,
              example: 5000,
            },
            idempotencyKey: {
              type: "string",
              description: "Unique key to prevent duplicate transactions",
              example: "txn-uuid-abc-12345",
            },
          },
        },
        InitialFundsRequest: {
          type: "object",
          required: ["toAccount", "amount", "idempotencyKey"],
          properties: {
            toAccount: {
              type: "string",
              description: "MongoDB ObjectId of target account",
              example: "665f1a2b3c4d5e6f7a8b9c0d",
            },
            amount: {
              type: "number",
              minimum: 0.01,
              maximum: 100000000,
              example: 100000,
            },
            idempotencyKey: {
              type: "string",
              example: "seed-uuid-xyz-99999",
            },
          },
        },
        TransactionResponse: {
          type: "object",
          properties: {
            _id: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0f" },
            fromAccount: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0d" },
            toAccount: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0e" },
            amount: { type: "number", example: 5000 },
            status: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
              example: "COMPLETED",
            },
            idempotencyKey: { type: "string", example: "txn-uuid-abc-12345" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ─── Errors ───────────────────────────────────────────────────
        ValidationError: {
          type: "object",
          properties: {
            status: { type: "string", example: "validation_error" },
            message: { type: "string", example: "Invalid request data" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: { type: "string", example: "Invalid email address" },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Unauthorized access, token is missing" },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "User registration and login",
      },
      {
        name: "Accounts",
        description: "Bank account management and balance queries",
      },
      {
        name: "Transactions",
        description: "Fund transfers and initial fund seeding",
      },
    ],
  },
  apis: [
    "./src/routes/auth.route.js",
    "./src/routes/account.route.js",
    "./src/routes/transaction.route.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
