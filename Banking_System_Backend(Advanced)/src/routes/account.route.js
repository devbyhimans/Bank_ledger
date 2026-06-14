const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");
const { validate } = require("../middleware/validate.middleware");
const { createAccountSchema } = require("../validators/account.validator");

const router = express.Router();

/**
 * @openapi
 * /api/accounts/create:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Create a new bank account
 *     description: |
 *       Creates a new bank account linked to the authenticated user.
 *       Account starts in ACTIVE status with INR currency by default.
 *       A user can hold multiple accounts.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccountRequest'
 *           example:
 *             currency: "INR"
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   $ref: '#/components/schemas/AccountResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized — token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/create",
  authMiddleware.authMiddleware,
  validate(createAccountSchema),
  accountController.createAccount
);

/**
 * @openapi
 * /api/accounts/:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get all accounts for the authenticated user
 *     description: |
 *       Returns all bank accounts belonging to the currently authenticated user.
 *       Includes accounts of all statuses (ACTIVE, FROZEN, CLOSED).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AccountResponse'
 *       401:
 *         description: Unauthorized — token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountController);

/**
 * @openapi
 * /api/accounts/balance/{accountId}:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get the balance of a specific account
 *     description: |
 *       Returns the real-time balance of an account, derived from the immutable ledger
 *       using a MongoDB aggregation pipeline (sum of CREDITs minus sum of DEBITs).
 *       The balance is never stored directly — the ledger is the source of truth.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the account
 *         example: "665f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BalanceResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Account not found or does not belong to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Account not found"
 */
router.get(
  "/balance/:accountId",
  authMiddleware.authMiddleware,
  accountController.getAccountBalanceController
);

module.exports = router;