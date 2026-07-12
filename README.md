# Digital Wallet API

A REST API for managing user accounts and single-currency digital wallets. Users can register, authenticate with JSON Web Tokens (JWTs), deposit and withdraw funds, and transfer money to another user's wallet. Transfers support currency conversion through the [Frankfurter exchange-rate API](https://www.frankfurter.app/).

> This is a backend API only; it does not include a web or mobile client.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Database setup](#database-setup)
- [API reference](#api-reference)
- [Authentication](#authentication)
- [API rate limiting and request throttling](#api-rate-limiting-and-request-throttling)
- [Data model](#data-model)
- [Application flow](#application-flow)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Security and operational notes](#security-and-operational-notes)
- [Known limitations](#known-limitations)

## Features

- User registration with bcrypt password hashing.
- JWT login sessions that expire after one day.
- One wallet is automatically created for every new user.
- Configurable wallet currency at registration time (defaults to `USD`).
- Wallet balance lookup, deposits, and withdrawals.
- Wallet-to-wallet transfers with transactional balance updates.
- Cross-currency transfers using current rates from Frankfurter.
- Transaction records for deposits, withdrawals, and transfers.
- Audit-log records for account creation, wallet creation, login, profile updates, deposits, withdrawals, and transfers.
- HTTP hardening, CORS, JSON parsing, and development request logging.

## Technology

| Area | Package / service |
| --- | --- |
| Runtime | Node.js (CommonJS) |
| Web framework | Express 5 |
| Database / ORM | MySQL and Sequelize 6 |
| Authentication | `jsonwebtoken` |
| Password hashing | `bcrypt` |
| Validation | `validator` plus application checks |
| HTTP middleware | `cors`, `helmet`, `morgan` |
| Currency conversion | Frankfurter API, requested with Axios |

## Requirements

- Node.js and npm
- A running MySQL server
- Network access to `api.frankfurter.app` when making transfers between different currencies

## Quick start

Run the following from the API directory:

```bash
cd digital-wallet-api
npm install
```

Create or update `.env` using the variables shown below, create the database and tables, then start the API:

```bash
npm run dev
```

The server listens on `http://localhost:9000` by default. Confirm it is running:

```bash
curl http://localhost:9000/api/healths
```

Expected response:

```json
{
  "success": true,
  "message": "Digital Wallet Server is running"
}
```

## Configuration

Create `digital-wallet-api/.env` (never commit its secret values):

```dotenv
PORT=9000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=digital_wallet
DB_USER=root
DB_PASSWORD=replace-with-your-password

# Required by login and every protected endpoint. Use a long random value.
JWT_SECRET=replace-with-a-long-random-secret

# Multi-currency fraud and transaction-limit controls (optional defaults shown)
LIMIT_BASE_CURRENCY=USD
DAILY_TRANSACTION_LIMIT=10000
HIGH_VALUE_TRANSACTION_LIMIT=5000
SUSPICIOUS_TRANSACTION_COUNT=5
SUSPICIOUS_TIME_WINDOW=10

# API rate limiting (optional defaults shown)
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=900000
USER_RATE_LIMIT_PER_MINUTE=60
USER_RATE_LIMIT_PER_HOUR=1000
TRANSACTION_RATE_LIMIT_PER_MINUTE=10
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `9000`. |
| `NODE_ENV` | No | Runtime environment label, for example `development`. |
| `DB_HOST` | Yes | MySQL host. |
| `DB_PORT` | Yes | MySQL port, normally `3306`. |
| `DB_NAME` | Yes | Database name. |
| `DB_USER` | Yes | Database user. |
| `DB_PASSWORD` | Yes | Database password. |
| `JWT_SECRET` | Yes | Secret used to sign and verify access tokens. |
| `LIMIT_BASE_CURRENCY` | No | Currency used to compare multi-currency spending limits. Defaults to `USD`. |
| `DAILY_TRANSACTION_LIMIT` | No | Maximum total outgoing withdrawals and transfers per user per UTC day, in the base currency. Defaults to `10000`. |
| `HIGH_VALUE_TRANSACTION_LIMIT` | No | Amount (in the base currency) considered high value for suspicious-activity checks. Defaults to `5000`. |
| `SUSPICIOUS_TRANSACTION_COUNT` | No | Number of high-value outgoing transactions allowed in the window before the request is blocked. Defaults to `5`. |
| `SUSPICIOUS_TIME_WINDOW` | No | Suspicious-activity lookback window in minutes. Defaults to `10`. |
| `AUTH_RATE_LIMIT_MAX` | No | Login/registration requests allowed per IP in the authentication window. Defaults to `10`. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | Authentication limit window in milliseconds. Defaults to `900000` (15 minutes). |
| `USER_RATE_LIMIT_PER_MINUTE` | No | Authenticated API requests allowed per user per minute. Defaults to `60`. |
| `USER_RATE_LIMIT_PER_HOUR` | No | Authenticated API requests allowed per user per hour. Defaults to `1000`. |
| `TRANSACTION_RATE_LIMIT_PER_MINUTE` | No | Deposit, withdrawal, and transfer requests allowed per user per minute. Defaults to `10`. |

## Database setup

Create the database first:

```sql
CREATE DATABASE digital_wallet
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

The application verifies database connectivity at startup, but it does **not** currently create or migrate tables automatically: the `sequelize.sync()` line in `src/server.js` is commented out. For local development, you may temporarily uncomment this line:

```js
await sequelize.sync({ alter: true });
```

Start the server once to let Sequelize create/update the schema, then remove or comment the line again. For shared or production environments, use reviewed Sequelize migrations rather than `sync({ alter: true })`.

The required tables are `users`, `wallets`, `transactions`, and `audit_logs`. Their fields and relationships are described in [Data model](#data-model).

## API reference

Base URL: `http://localhost:9000`

Protected endpoints require `Authorization: Bearer <token>`. Amounts may be sent as JSON numbers or numeric strings; they must be greater than zero.

### Health check

#### `GET /api/healths`

Reports whether the HTTP server is running. This route does not require authentication.

### Users

#### `POST /api/users/register`

Creates a user and its wallet in a database transaction.

Request body:

```json
{
  "name": "Ava Patel",
  "email": "ava@example.com",
  "password": "secure-password",
  "defaultCurrency": "USD"
}
```

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | Must be present. |
| `email` | Yes | Must be a valid email and unique. |
| `password` | Yes | At least 6 characters. |
| `defaultCurrency` | No | Wallet currency; defaults to `USD`. |

Success: `201 Created`. The response is the Sequelize user object. It currently includes the stored password hash, so consumers should handle this response carefully.

Common errors: `400 Bad Request` for invalid fields or an email that already exists.

#### `POST /api/users/login`

Authenticates a user and returns a one-day JWT.

```json
{
  "email": "ava@example.com",
  "password": "secure-password"
}
```

Success response (`200 OK`):

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Ava Patel",
    "email": "ava@example.com"
  }
}
```

Invalid credentials return `401 Unauthorized`.

#### `PUT /api/users/:id`

Updates a user. Authentication is required.

```json
{
  "name": "Ava Shah",
  "defaultCurrency": "EUR"
}
```

At least one of `name`, `email`, or `defaultCurrency` must be supplied. If a password is supplied, it must contain at least six characters. The route returns the updated user object.

> Updating `defaultCurrency` updates the user record only; it does not change the existing wallet's `currency`.

#### `GET /api/users/profile/:id`

Returns the user identified by `:id`. Authentication is required.

#### `GET /api/users/alluser`

Returns all users. Authentication is required.

> The current authorization middleware validates a token but does not enforce ownership or roles. Any authenticated user can call the profile, update, and list-user routes. See [Known limitations](#known-limitations).

### Wallet

#### `GET /api/wallet/`

Returns the authenticated user's wallet.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "balance": "0.00",
    "currency": "USD",
    "status": "ACTIVE"
  }
}
```

#### `POST /api/wallet/deposit`

Adds funds to the authenticated user's active wallet and creates a `DEPOSIT` transaction.

```json
{
  "amount": 125.5
}
```

Success: `200 OK` with `{ "success": true, "message": "Funds added successfully", "data": { ... } }`.

#### `POST /api/wallet/withdraw`

Subtracts funds from the authenticated user's active wallet and creates a `WITHDRAW` transaction.

```json
{
  "amount": 25
}
```

The request fails with `400 Bad Request` when the wallet is inactive or lacks sufficient funds.

#### `POST /api/wallet/transfer`

Transfers funds from the authenticated user's wallet to another user's wallet.

```json
{
  "receiverUserId": 2,
  "amount": 50
}
```

The sender is debited in the sender wallet currency. The receiver is credited in the receiver wallet currency. If the currencies differ, the API requests the current exchange rate and saves it on the transaction. The balance updates and transaction insert execute within one database transaction.

Common errors: `400 Bad Request` for missing/invalid amounts, nonexistent wallets, insufficient sender balance, or unavailable exchange rates.

### Transaction history

#### `GET /api/transactions/`

Returns the authenticated user's transactions, newest first. Results are paginated.

| Query parameter | Required | Default | Rules |
| --- | --- | --- | --- |
| `page` | No | `1` | Positive integer. |
| `limit` | No | `10` | Positive integer; values above `100` are capped at `100`. |
| `type` | No | — | Filter by `DEPOSIT`, `WITHDRAW`, or `TRANSFER`. |

Example:

```http
GET /api/transactions/?page=2&limit=10&type=TRANSFER
Authorization: Bearer <token>
```

Success response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 10,
    "totalItems": 24,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

Every transaction includes safe nested counterparties where applicable: `senderWallet.user` and `receiverWallet.user`, each with `id`, `name`, and `email` only.

### Standard error shapes

User routes generally return:

```json
{ "message": "Error description" }
```

Wallet routes generally return:

```json
{ "success": false, "message": "Error description" }
```

## Authentication

1. Call `POST /api/users/login`.
2. Copy the returned `token`.
3. Send it with each protected request:

```http
Authorization: Bearer <token>
```

Tokens contain the authenticated user's `id` and `email`, are signed with `JWT_SECRET`, and expire after one day. Missing or invalid tokens return `401` with `Token required` or `Invalid token`.

## API rate limiting and request throttling

The API applies fixed-window request controls before a request reaches its controller:

| Traffic | Scope | Default |
| --- | --- | --- |
| Registration and login | Client IP address | 10 requests per 15 minutes |
| Protected API routes | Authenticated user ID from the JWT | 60 requests per minute and 1,000 per hour |
| Deposits, withdrawals, and transfers | Authenticated user ID from the JWT | 10 requests per minute, in addition to the general user limit |

When a limit is exceeded, the API responds with `429 Too Many Requests` and a `Retry-After` header:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "limit": "Transaction-Minute",
  "retryAfterSeconds": 42
}
```

Responses also include `X-RateLimit-*-Limit`, `X-RateLimit-*-Remaining`, and `X-RateLimit-*-Reset` headers. The controls limit requests only; they do not convert or aggregate amounts. Therefore each wallet retains its own currency and the existing exchange-rate conversion still runs exactly once for every permitted cross-currency transfer.

The current limiter stores counters in memory. It is suitable for a single API instance and development assignment. Use Redis or another shared store for multiple instances, restarts, or production-grade distributed limits.

## Fraud detection and transaction limits

Before a withdrawal or transfer changes a wallet balance, the API applies these checks:

1. It converts the requested outgoing amount and the user's successful outgoing transactions into `LIMIT_BASE_CURRENCY` (`USD` by default).
2. It blocks the request if the total for the current UTC day would exceed `DAILY_TRANSACTION_LIMIT`.
3. For a high-value request, it counts prior high-value withdrawals/transfers made in the preceding `SUSPICIOUS_TIME_WINDOW`. The request is blocked when including it reaches `SUSPICIOUS_TRANSACTION_COUNT`.

Blocked activity returns `400 Bad Request` with the applicable reason and creates an `audit_logs` record with action `FRAUD_TRANSACTION_BLOCKED`. Deposits are not counted because they do not move value out of a wallet. Exchange rates are fetched at validation time so limits are applied consistently across currencies.

For production financial systems, preserve the historical rate used for every limit calculation or store a normalized base-currency amount with each transaction. The current implementation uses the latest available rate when evaluating prior transactions.

## Data model

```text
User (1) ──── (1) Wallet
  │
  └──── (many) AuditLog

Wallet (1) ──── (many) Transaction, as sender
Wallet (1) ──── (many) Transaction, as receiver
```

| Table | Important fields | Purpose |
| --- | --- | --- |
| `users` | `id`, `name`, `email` (unique), `password`, `defaultCurrency` | User identity and login credentials. |
| `wallets` | `id`, `userId` (unique), `balance`, `currency`, `status` | One wallet per user; status is `ACTIVE` or `BLOCKED`. |
| `transactions` | sender/receiver wallet IDs, amounts, currencies, `exchangeRate`, `transactionType`, `status`, `description` | Financial-event history. Types used: `DEPOSIT`, `WITHDRAW`, `TRANSFER`. |
| `audit_logs` | `userId`, `action`, `entity`, old/new values, `ipAddress` | Operational audit trail. |

Monetary fields are stored as MySQL `DECIMAL` values. Sequelize commonly serializes these values as strings in JSON responses; clients should parse them deliberately and avoid floating-point arithmetic for financial totals.

Transaction-history responses include `senderWallet.user` and `receiverWallet.user` when applicable. Each nested user contains only `id`, `name`, and `email`, allowing clients to display the transfer counterparty without exposing password data.

## Application flow

```text
HTTP request
  → Express middleware (JSON, CORS, Helmet, Morgan)
  → route
  → JWT middleware (protected routes)
  → controller validation
  → service layer
  → Sequelize / MySQL
  → JSON response
```

For deposits, withdrawals, and transfers, the service opens a database transaction and locks the involved wallet rows before changing balances. This helps prevent concurrent requests from spending the same balance twice.

## Project structure

```text
digital-wallet-api/
├── src/
│   ├── app.js                 # Express application and routes
│   ├── server.js              # Environment loading, server start, DB check
│   ├── config/database.js     # Sequelize MySQL connection
│   ├── controllers/           # HTTP request/response handling
│   ├── middleware/            # JWT authentication
│   ├── models/                # Sequelize models and associations
│   ├── routes/                # User and wallet routes
│   ├── services/              # Business logic and exchange-rate client
│   ├── utils/                 # JWT and audit helpers
│   └── validations/           # Request validation functions
├── .env                       # Local configuration (keep private)
├── package.json
└── README.md
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Runs `node src/server.js`. |
| `npm run dev` | Runs the server with Nodemon for automatic restarts. |
| `npm test` | Present but not implemented; exits with an error. |

