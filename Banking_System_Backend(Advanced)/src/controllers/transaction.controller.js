const transactionModel = require("../model/transaction.model");
const ledgerModel = require("../model/ledger.model");
const accountModel = require("../model/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */
async function createTransaction(req, res) {
  let session;
  try {
    // 1. Validate request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "FromAccount, toAccount, amount and idempotencyKey are required"
      });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({
        message: "Cannot transfer money to the same account"
      });
    }

    const fromUserAccount = await accountModel.findById(fromAccount);
    const toUserAccount = await accountModel.findById(toAccount);

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({
        message: "Invalid fromAccount or toAccount"
      });
    }

    // 2. Validate idempotency key
    const isTransactionAlreadyExists = await transactionModel.findOne({
      idempotencyKey: idempotencyKey
    });

    if (isTransactionAlreadyExists) {
      if (isTransactionAlreadyExists.status === "COMPLETED") {
        return res.status(200).json({
          message: "Transaction already processed",
          transaction: isTransactionAlreadyExists
        });
      }

      if (isTransactionAlreadyExists.status === "PENDING") {
        return res.status(200).json({
          message: "Transaction is still processing"
        });
      }

      if (isTransactionAlreadyExists.status === "FAILED") {
        return res.status(400).json({
          message: "Transaction processing failed, please retry with a new idempotency key"
        });
      }

      if (isTransactionAlreadyExists.status === "REVERSED") {
        return res.status(400).json({
          message: "Transaction was reversed, please retry with a new idempotency key"
        });
      }
    }

    // 3. Check account status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
      });
    }

    // 4. Derive sender balance from ledger
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
      });
    }

    // Start DB Transaction Session
    session = await mongoose.startSession();
    session.startTransaction();

    // 5. Create transaction (PENDING)
    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING"
        }
      ],
      { session }
    );

    // 6. Create DEBIT ledger entry
    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT"
        }
      ],
      { session }
    );

    // 7. Create CREDIT ledger entry
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT"
        }
      ],
      { session }
    );

    // 8. Mark transaction COMPLETED
    const completedTransaction = await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session, new: true }
    );

    // 9. Commit MongoDB session
    await session.commitTransaction();

    // 10. Send email notification (async outside of the block)
    emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount).catch(console.error);

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction: completedTransaction
    });

  } catch (error) {
    console.error("Transaction failed:", error);
    if (session) {
      await session.abortTransaction();
    }
    return res.status(500).json({
      message: "Transaction failed. Please retry after some time.",
      error: error.message
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

async function createIntialFunds(req, res) {
  let session;
  try {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "toAccount, amount and idempotencyKey are required"
      });
    }

    const toUserAccount = await accountModel.findById(toAccount);

    if (!toUserAccount) {
      return res.status(400).json({
        message: "Invalid toAccount"
      });
    }

    const fromUserAccount = await accountModel.findOne({
      systemAccount: true,
      user: req.user._id
    });

    if (!fromUserAccount) {
      return res.status(400).json({
        message: "System user account not found"
      });
    }

    // Start DB Transaction Session
    session = await mongoose.startSession();
    session.startTransaction();

    // 5. Create transaction (PENDING)
    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount: fromUserAccount._id,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING"
        }
      ],
      { session }
    );

    // 6. Create DEBIT ledger entry
    await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT"
        }
      ],
      { session }
    );

    // 7. Create CREDIT ledger entry
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT"
        }
      ],
      { session }
    );

    // 8. Mark transaction COMPLETED
    const completedTransaction = await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session, new: true }
    );

    // 9. Commit MongoDB session
    await session.commitTransaction();

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction: completedTransaction
    });

  } catch (error) {
    console.error("Initial funds transaction failed:", error);
    if (session) {
      await session.abortTransaction();
    }
    return res.status(500).json({
      message: "Initial funds transaction failed",
      error: error.message
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

module.exports = {
  createTransaction,
  createIntialFunds,
  
};
