# Campaign Assistant

An internal tool for DME Systems that helps a marketing team understand customer activity, build customer segments, and prepare targeted campaigns with AI-generated content.

contain in here is not an exhaustive list of all the apis routes.  

## Features

- **Customer dashboard**: list customers (name, country, total transactions, total spent, last activity, status) with summary KPIs.
- **Segmentation**: build segments from conditions and see how many customers match.
- **Campaign creation**: pick an objective, segment, channel and tone; the AI generates a title, message and call-to-action.
- **Natural-language commands**: type what you want ("Customers from Cameroon with more than 5 transactions and over 50,000 spent") and the AI converts it into one of the supported actions.

## Architecture

```
Frontend (UI)  ──HTTP/JSON──▶  Backend API  ──▶  Database
                                    │
                                    └──▶  AI service (LLM)
```

- **Frontend**: dashboard, segment builder, campaign form, command box.
- **Backend**: REST API, aggregation queries, AI orchestration.
- **AI service**: used for two jobs only: (1) turning natural-language commands into structured actions, (2) writing campaign content.
- **Users**: system users are admins. Only admins log in and use the tool; customers never access it.

## Data model

| Table | Purpose | Key fields |
|---|---|---|
| `users` | Admins who use the tool | id, name, email, password_hash, role |
| `customers` | People the marketing team targets | id, name, email, phone, country, created_at |
| `transactions` | Money spent by a customer | id, customer_id, amount, created_at |
| `segments` | Saved segment definitions | id, name, rules (JSON), created_by, created_at |
| `campaigns` | Prepared campaigns | id, segment_id, objective, channel, tone, title, message, cta, status, created_by, created_at |

### Derived values (not stored, computed by aggregation)

| Value | How it is computed |
|---|---|
| `totalTransactions` | `COUNT` of the customer's transactions |
| `totalSpent` | `SUM(amount)` of the customer's transactions |
| `lastActivityDate` | `MAX(created_at)` of the customer's transactions |
| `status` | `active` if last activity is within the active window (e.g. 30 days), otherwise `inactive` |

### Dashboard KPIs

| KPI | Definition |
|---|---|
| Total customers | Count of customers |
| Active customers | Customers with activity inside the active window |
| Total transaction value | Sum of all transaction amounts |
| Average customer value | Total transaction value ÷ total customers |

## Segment rules

A segment is a set of conditions combined with **AND**. All fields are optional.

| Field | Type | Meaning |
|---|---|---|
| `country` | string | Customer's country |
| `minTransactionValue` | number | Total spent is greater than this |
| `minTransactionCount` | number | Number of transactions is greater than this |
| `activeWithinDays` | number | Last activity within the last X days |

Example: *"Customers from Cameroon who made more than 5 transactions and spent more than 50,000 XAF"*

```json
{
  "country": "Cameroon",
  "minTransactionCount": 5,
  "minTransactionValue": 50000
}
```

## AI usage

**1. Command interpreter.** The user's text is sent to the model along with the list of supported actions. The model must return JSON only, which the backend validates before executing. The model never touches the database directly.

Supported actions: `preview_segment`, `create_segment`, `generate_campaign`, `show_kpis`.

**2. Content generator.** Given objective, segment summary, channel and tone, the model returns a title, message and call-to-action. The message respects the channel (short for SMS and Push, longer for Email).

> Always validate AI output on the server (required fields, allowed action names, numeric ranges) before using it.

---

# API reference

**Base URL:** `/api/v1`
**Format:** JSON requests and responses
**Auth:** all endpoints except login require the header `Authorization: Bearer <token>`

### Error format

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "channel must be one of SMS, EMAIL, PUSH" } }
```

| Status | Meaning |
|---|---|
| 200 / 201 | Success / created |
| 400 | Invalid input |
| 401 | Missing or invalid token |
| 404 | Resource not found |
| 500 | Server or AI service error |

---

## Auth

### `POST /auth/login`

```json
// request
{ "email": "admin@dme.com", "password": "secret" }

// response 200
{ "token": "<jwt>", "user": { "id": 1, "name": "Admin", "role": "admin" } }
```

---

## Customers

### `GET /customers`

Query params (all optional): `search`, `country`, `status` (`active`/`inactive`), `page` (default 1), `limit` (default 20), `sortBy` (`totalSpent`, `totalTransactions`, `lastActivityDate`), `order` (`asc`/`desc`).

```json
// response 200
{
  "data": [
    {
      "id": 12,
      "name": "Jane Doe",
      "country": "Cameroon",
      "totalTransactions": 8,
      "totalSpent": 120000,
      "lastActivityDate": "2026-09-28T10:15:00Z",
      "status": "active"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 340
}
```

### `GET /customers/:id`

Returns one customer with the same fields as above plus their recent transactions.

---

## Dashboard

### `GET /stats

```json
{
  "totalCustomers": 340,
  "activeCustomers": 190,
  "totalTransactionValue": 48500000,
  "averageCustomerValue": 142647
}
```

---

## Segments

### `POST /segments/preview`

Counts matching customers without saving.

```json
// request
{
  "country": "Cameroon",
  "minTransactionCount": 5,
  "minTransactionValue": 50000,
  "activeWithinDays": 30
}

// response 200
{ "matchCount": 42 }
```

### `POST /segments`

```json
// request
{
  "name": "Loyal Cameroon customers",
  "rules": { "country": "Cameroon", "minTransactionCount": 5, "minTransactionValue": 50000 }
}

// response 201
{ "id": 3, "name": "Loyal Cameroon customers", "rules": { ... }, "matchCount": 42 }
```

### `GET /segments`
List saved segments, each with its current `matchCount`.

### `GET /segments/:id`
One segment with rules and `matchCount`.

### `GET /segments/:id/customers`
Customers currently matching the segment. Supports `page` and `limit`.

### `DELETE /segments/:id`
Deletes a segment. Returns `204`.

---

## Campaigns

### `POST /campaigns/generate`

Asks the AI for content. Nothing is saved.

```json
// request
{
  "objective": "Win back customers who have not purchased recently",
  "segmentId": 3,
  "channel": "SMS",
  "tone": "friendly"
}

// response 200
{
  "title": "We Miss You!",
  "message": "Hi! It's been a while. Enjoy 10% off your next purchase this week.",
  "callToAction": "Shop now"
}
```

| Field | Rules |
|---|---|
| `objective` | required, text |
| `segmentId` | required, must exist |
| `channel` | required, one of `SMS`, `EMAIL`, `PUSH` |
| `tone` | required, e.g. `friendly`, `professional`, `urgent`, `playful` |

### `POST /campaigns`

Saves a campaign (typically after the user reviews or edits the generated content).

```json
// request
{
  "segmentId": 3,
  "objective": "Win back customers who have not purchased recently",
  "channel": "SMS",
  "tone": "friendly",
  "title": "We Miss You!",
  "message": "Hi! It's been a while. Enjoy 10% off your next purchase this week.",
  "callToAction": "Shop now"
}

// response 201
{ "id": 7, "status": "draft", "createdAt": "2026-10-07T09:00:00Z", ... }
```

### `GET /campaigns`
List campaigns. Optional filters: `segmentId`, `channel`, `status`.

### `GET /campaigns/:id`
One campaign.

---

## AI commands

### `POST /ai/command`

Converts natural language into a supported action and returns the result of running it (or a preview for the user to confirm).

```json
// request
{ "command": "Customers from Cameroon who made more than 5 transactions and spent more than 50,000" }

// response 200
{
  "action": "preview_segment",
  "parameters": { "country": "Cameroon", "minTransactionCount": 5, "minTransactionValue": 50000 },
  "result": { "matchCount": 42 }
}
```

If the command can't be mapped to a supported action:

```json
{ "action": "unknown", "message": "I couldn't understand that. Try describing a segment or a campaign." }
```

---

## Known limitations

- **Single currency.** `transactions` stores only `amount`. Values from different currencies would be added together incorrectly. If more than one currency is needed, `currency` table for different currencies , set customer's default currency and have the system be based on one default currency so that every amount in the system is saved in the default currency and it will be easier for analysis.
- Segment conditions are combined with AND only (no OR / nested groups).
- `totalSpent` and the other derived values are calculated on every request; add caching or a materialized view if the data grows.
- Campaigns are prepared and saved only, not sent.

## Future improvements

- Add `currency` to `transactions` (and a rates table) for multi-currency totals.
- Support OR groups in segment rules.
- Actually send campaigns through SMS, email and push providers.
- Track campaign results (delivered, opened, clicked).

---

## Setup

### Prerequisites

- Node.js and npm
- Docker (with Docker Compose) for the database

### 1. Configure environment variables

Create a `.env` file in each app from its example file:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then open both `.env` files and fill in the values (database connection, JWT secret, AI API key, API base URL for the frontend).

### 2. Start the database

From the project root:

```bash
docker compose up -d
```

### 3. Start the backend

```bash
cd backend
npm install
npm run seed   # creates mock customers and transactions
npm run dev
```

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by the frontend dev server in your browser.

### Command summary

| Where | Command | Purpose |
|---|---|---|
| root | `docker compose up -d` | Run the database service |
| `backend/` | `npm run seed` | Seed mock data |
| `backend/` | `npm run dev` | Run the API server |
| `frontend/` | `npm run dev` | Run the UI |


# AI Assistance

I used opencode for project setup but it came woth alot of bugs and I had to switch to claude code. wrote a couple of test cases with claude and setup the basic files for the frontend and backend. 

Generally I use Ai with caution because while it give code , it is more difficult to fix the code and make it work as it should. I tried to use ai to gain more time but it was the opposite , since I spent a huge chunk of the time debugging items I would have writing myself using the proper documentation. 

Ai was useful for the frontend with creating the designs so I did not have to think much about how to design, only making changes when needed and setting it the file structure and the statemanagement.