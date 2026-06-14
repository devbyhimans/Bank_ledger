const { Router } = require("express");
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createTransactionSchema,
  initialFundsSchema,
} = require("../validators/transaction.validator");

const transactionRoutes = Router();

/**
 * @openapi
 * /api/transactions/:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Transfer funds between two accounts
 *     description: |
 *       Executes an atomic fund transfer using a 10-step flow:
 *
 *       1. Validate request body
 *       2. Check idempotency key (prevents duplicate transactions)
 *       3. Verify both accounts are ACTIVE
 *       4. Derive sender balance from the ledger (aggregation)
 *       5. Create transaction record (PENDING)
 *       6. Create DEBIT ledger entry for sender
 *       7. Create CREDIT ledger entry for receiver
 *       8. Mark transaction as COMPLETED
 *       9. Commit MongoDB session (ACID)
 *       10. Send email notification to sender
 *
 *       All database writes are wrapped in a MongoDB session for full ACID compliance.
 *       If any step fails, the entire operation is rolled back.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *           example:
 *             fromAccount: "665f1a2b3c4d5e6f7a8b9c0d"
 *             toAccount: "665f1a2b3c4d5e6f7a8b9c0e"
 *             amount: 5000
 *             idempotencyKey: "txn-uuid-abc-12345"
 *     responses:
 *       200:
 *         description: Transaction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction completed successfully"
 *                 transaction:
 *                   $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation:
 *                 summary: Schema validation failed
 *                 value:
 *                   status: "validation_error"
 *                   message: "Invalid request data"
 *                   errors:
 *                     - field: "amount"
 *                       message: "Amount must be greater than 0"
 *               sameAccount:
 *                 summary: Same account transfer
 *                 value:
 *                   message: "Cannot transfer money to the same account"
 *               insufficientFunds:
 *                 summary: Insufficient balance
 *                 value:
 *                   message: "Insufficient balance. Current balance: 1000"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Transaction failed (rolled back)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction failed"
 *                 error:
 *                   type: string
 */
transactionRoutes.post(
  "/",
  authMiddleware.authMiddleware,
  validate(createTransactionSchema),
  transactionController.createTransaction
);

/**
 * @openapi
 * /api/transactions/system/intial-funds:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Seed initial funds into an account (System User only)
 *     description: |
 *       Injects initial funds into a target account from the system account.
 *       **Restricted to system users only** — regular users will receive 403.
 *
 *       Use the `setup-system-user.js` script to create a system user and obtain its token.
 *
 *       This endpoint is used to bootstrap new accounts with starting balances.
 *       It follows the same double-entry pattern: DEBIT from system account, CREDIT to target account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitialFundsRequest'
 *           example:
 *             toAccount: "665f1a2b3c4d5e6f7a8b9c0d"
 *             amount: 100000
 *             idempotencyKey: "seed-uuid-xyz-99999"
 *     responses:
 *       201:
 *         description: Initial funds seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Initial funds transaction completed successfully"
 *                 transaction:
 *                   $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Validation error or invalid account
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized — token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — not a system user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied, not a System user"
 *       500:
 *         description: Transaction failed (rolled back)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
transactionRoutes.post(
  "/system/intial-funds",
  authMiddleware.authSystemUserMiddleware,
  validate(initialFundsSchema),
  transactionController.createIntialFunds
);

module.exports = transactionRoutes;