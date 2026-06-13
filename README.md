# 🏦 Banking Ledger - Backend API

A robust, production-grade **Banking Ledger System** built with Node.js, Express, and MongoDB. This system implements **double-entry bookkeeping** principles where the ledger serves as the single source of truth for all account balances.

---

## ✨ Features

### 🔐 Authentication & Authorization
- **User Registration** with email/password and automatic welcome email notification
- **User Login** with JWT-based authentication (cookie + Bearer token support)
- **Password Hashing** using bcrypt with salt rounds
- **Protected Routes** via JWT middleware

### 🏛️ Account Management
- **Create Bank Accounts** linked to authenticated users
- **Multi-Account Support** — users can hold multiple accounts
- **Account Status Management** — `ACTIVE`, `FROZEN`, `CLOSED` states
- **System Accounts** — special immutable accounts for system-level operations
- **INR Currency** default with extensible currency support
- **Compound Indexing** on user + status for optimized queries

### 💸 Transaction System
- **Peer-to-Peer Transfers** between any two active accounts
- **10-Step Transfer Flow** — validates, creates entries, and commits atomically
- **MongoDB Transactions (Sessions)** — full ACID compliance for transfer operations
- **Idempotency Key Support** — prevents duplicate transactions on retry
- **Transaction States** — `PENDING`, `COMPLETED`, `FAILED`, `REVERSED`
- **Balance Validation** — checks sufficient funds before transfer
- **Initial Funds Injection** — system user can seed accounts with funds

### 📒 Double-Entry Ledger
- **Immutable Ledger Entries** — once created, entries cannot be modified or deleted
- **CREDIT/DEBIT Tracking** — every transaction creates paired ledger entries
- **Ledger-Derived Balances** — balances are computed via MongoDB aggregation pipeline (no stored balance field)
- **Tamper-Proof Design** — middleware hooks block all update/delete operations on ledger entries

### 📧 Email Notifications (Gmail OAuth2)
- **Registration Welcome Email** — sent on successful signup
- **Transaction Success Email** — sent after each completed transfer
- **Transaction Failure Email** — template ready for failed transfer notifications
- **OAuth2 Authentication** — secure Gmail integration via Google APIs

### 🛡️ System User & Admin Features
- **Dedicated System User** — special privileged user for fund injection
- **System User Middleware** — separate auth middleware verifying `systemUser` flag
- **Setup Script** — automated system user + account creation (`setup-system-user.js`)

---

## 🗂️ Project Structure

```
Banking_System_Backend(Advanced)/
├── server.js                    # Entry point
├── package.json                 # Dependencies & scripts
├── setup-system-user.js         # System user bootstrap script
├── test-apis.js                 # API test script
├── test-email.js                # Email service test
├── test-initial-funds.js        # Initial funds flow test
└── src/
    ├── app.js                   # Express app setup & route mounting
    ├── config/
    │   └── db.js                # MongoDB connection config
    ├── controllers/
    │   ├── auth.controller.js   # Register & Login logic
    │   ├── account.controller.js# Account CRUD & balance
    │   └── transaction.controller.js # Transfer & initial funds
    ├── middleware/
    │   └── auth.middleware.js    # JWT auth & system user auth
    ├── model/
    │   ├── user.model.js        # User schema with bcrypt hooks
    │   ├── account.model.js     # Account schema with getBalance()
    │   ├── transaction.model.js # Transaction schema with idempotency
    │   └── ledger.model.js      # Immutable ledger schema
    ├── routes/
    │   ├── auth.route.js        # /api/auth/*
    │   ├── account.route.js     # /api/account/*
    │   └── transaction.route.js # /api/transaction/*
    └── services/
        └── email.service.js     # Gmail OAuth2 email service
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (local or Atlas with replica set for transactions)
- **Gmail OAuth2 Credentials** (for email notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/devbyhimans/Bank_ledger.git
cd Bank_ledger/Banking_System_Backend(Advanced)

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the `Banking_System_Backend(Advanced)/` directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/banking_ledger
JWT_SECRET=your_jwt_secret

# Gmail OAuth2
EMAIL_USER=your_email@gmail.com
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_google_refresh_token
```

### Run the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Bootstrap System User

```bash
node setup-system-user.js
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description        | Auth |
|--------|-----------------------|--------------------|------|
| POST   | `/api/auth/register`  | Register new user  | ❌   |
| POST   | `/api/auth/login`     | Login user         | ❌   |

### Account
| Method | Endpoint                         | Description         | Auth |
|--------|----------------------------------|---------------------|------|
| POST   | `/api/account/create`            | Create new account  | ✅   |
| GET    | `/api/account/`                  | Get user's accounts | ✅   |
| GET    | `/api/account/balance/:accountId`| Get account balance | ✅   |

### Transaction
| Method | Endpoint                                  | Description          | Auth         |
|--------|-------------------------------------------|----------------------|--------------|
| POST   | `/api/transaction/`                       | Transfer funds       | ✅ User      |
| POST   | `/api/transaction/system/intial-funds`    | Seed initial funds   | ✅ System    |

---

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer + Gmail OAuth2 (Google APIs)
- **Sessions**: MongoDB Transactions (ACID)

---

## 📄 License

ISC

---

Built with ❤️ by [devbyhimans](https://github.com/devbyhimans)
