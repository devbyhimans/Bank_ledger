const ledgerModel = require("../model/ledger.model");
const transactionModel = require("../model/transaction.model");
const accountModel = require("../model/account.model");

const emailService = require("../services/email.service");

const mongoose = require("mongoose");

/*
 * - Create a new transaction
 *
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
        message: "Missing credentials to complete transaction",
      });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({
        message: "Cannot transfer money to the same account",
      });
    }

    const fromUserAccount = await accountModel.findById(fromAccount);
    const toUserAccount = await accountModel.findById(toAccount);

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({
        message: "Invalid sender or receiver account",
      });
    }

    // 2. Validate idempotency key
    const existingTransaction = await transactionModel.findOne({
      idempotencyKey,
    });

    if (existingTransaction) {
      if (existingTransaction.status === "COMPLETED") {
        return res.status(200).json({
          message: "Transaction already completed",
          transaction: existingTransaction,
        });
      }

      if (existingTransaction.status === "PENDING") {
        return res.status(200).json({
          message: "Transaction is still processing",
        });
      }

      if (existingTransaction.status === "FAILED") {
        return res.status(400).json({
          message: "Previous transaction failed. Use a new idempotency key.",
        });
      }

      if (existingTransaction.status === "REVERSED") {
        return res.status(400).json({
          message: "Transaction was reversed. Use a new idempotency key.",
        });
      }
    }

    // 3. Check account status
    if (
      fromUserAccount.status !== "ACTIVE" ||
      toUserAccount.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        message: "Both accounts must be ACTIVE",
      });
    }

    // 4. Derive sender balance from ledger
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. Current balance: ${balance}`,
      });
    }

    // Start DB Transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // 5. Create transaction (PENDING)
    const transaction = new transactionModel({
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });

    await transaction.save({ session });

    // 6. Create DEBIT ledger entry
    const debitLedgerEntry = new ledgerModel({
      account: fromAccount,
      amount,
      transaction: transaction._id,
      type: "DEBIT",
    });

    await debitLedgerEntry.save({ session });

    // 7. Create CREDIT ledger entry
    const creditLedgerEntry = new ledgerModel({
      account: toAccount,
      amount,
      transaction: transaction._id,
      type: "CREDIT",
    });

    await creditLedgerEntry.save({ session });

    // 8. Mark transaction COMPLETED
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    // 9. Commit MongoDB session
    await session.commitTransaction();

    // 10. Send email notification
    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toAccount
    );

    return res.status(200).json({
      message: "Transaction completed successfully",
      transaction,
    });
  } catch (error) {
    console.error(error);

    if (session) {
      await session.abortTransaction();
    }

    return res.status(500).json({
      message: "Transaction failed",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}


async function createIntialFunds(req,res) {
  let session;

  try {
    const {toAccount,amount,idempotencyKey} = req.body

    if(!toAccount||!amount||!idempotencyKey){
      return res.status(400).json({
        message:"toAccount , amount or idempotencyKey are required"
      })
    }

    const toUserAccount = await accountModel.findOne({
      _id:toAccount,
    })

    if(!toUserAccount){
      return res.status(400).json({
        message:"Invalid toAccount"
      })
    }

    const fromUserAccount = await accountModel.findOne({
      systemAccount:true,
      user:req.user._id
    })

    //if by anyhow system user gets removed or deleted
    if(!fromUserAccount){
      return res.status(400).json({
        message:"System User account not found"
      })
    }

    //starting the session to make the transaction
    session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
      fromAccount:fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status:"PENDING"
    })

    await transaction.save({session})

    const debitEntry = new ledgerModel({
      account:fromUserAccount._id,
      amount:amount,
      transaction:transaction._id,
      type:"DEBIT"
    })
    await debitEntry.save({session})

    const creditEntry = new ledgerModel({
      account:toAccount,
      amount:amount,
      transaction:transaction._id,
      type:"CREDIT"
    })
    await creditEntry.save({session})

    transaction.status = "COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()

    return res.status(201).json({
      message:"Initial funds transaction completed successfully",
      transaction
    })
  } catch (error) {
    console.error(error);

    if (session) {
      await session.abortTransaction();
    }

    return res.status(500).json({
      message: "Initial funds transaction failed",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}
module.exports = {
  createTransaction,
  createIntialFunds
};