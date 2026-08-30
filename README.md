# 🧠 LifeOS — AI-Powered Personal Obligation Intelligence Platform

> **"What do I need to do, why does it matter, and what should I do first?"**

LifeOS connects fragmented information from your digital life—including **Gmail**, **Google Calendar**, and **uploaded documents** (PDF, TXT)—and transforms that data into a continuously updated, prioritized understanding of your responsibilities, deadlines, missing requirements, dependencies, and recommended next actions using cooperating AI processing agents.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture & Processing Workflow](#-architecture--processing-workflow)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Local Setup](#-step-by-step-local-setup)
  - [1. Clone and Navigate](#1-clone-and-navigate)
  - [2. Backend Configuration & Setup](#2-backend-configuration--setup)
  - [3. Frontend Configuration & Setup](#3-frontend-configuration--setup)
  - [4. Optional Services (MongoDB & Redis)](#4-optional-services-mongodb--redis)
  - [5. Google OAuth 2.0 Configuration](#5-google-oauth-20-configuration)
  - [6. AI Providers Setup](#6-ai-providers-setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [AI Fallback & Agent Pipeline](#-ai-fallback--agent-pipeline)
- [Error Codes Reference](#-error-codes-reference)
- [Development Phases](#-development-phases)
- [Security Best Practices](#-security-best-practices)

---

## 🌟 Overview

Instead of asking users to manually type and organize every task, LifeOS:
- 📥 **Ingests** emails, calendar appointments, and uploaded documents.
- 🤖 **Analyzes** content through a multi-agent AI pipeline (Extraction $\to$ Relationship $\to$ Validation $\to$ Priority $\to$ Recovery $\to$ Monitoring).
- ⛓️ **Builds Dependency Graphs** (e.g., *Get Marks Memo* $\to$ *Submit Application* $\to$ *Attend Interview*).
- 📊 **Calculates Explainable Priority Scores** based on deadline urgency, dependency impact, missing requirements, and overdue penalties.
- ⚡ **Streams Real-Time Updates** to the UI via Socket.IO.
- 💬 **Answers Natural Language Questions** via a context-aware AI assistant.

---

## 🏗️ Architecture & Processing Workflow

```
 USER INFORMATION
       │
 ┌─────┼──────────┐
 ↓     ↓          ↓
Gmail Calendar Documents
 │       │         │
 └───────┼─────────┘
         ↓
 INFORMATION INGESTION
         ↓
 BACKGROUND PROCESSING (BullMQ + Redis / In-Memory Fallback)
         ↓
 ┌────────────────────────────────────────────────────────┐
 │                   LIFEOS AI AGENTS                     │
 ├────────────────────────────────────────────────────────┤
 │ 1. Extraction Agent   - Tasks, deadlines, requirements │
 │ 2. Relationship Agent - Duplicates & dependencies DAG  │
 │ 3. Validation Agent   - Schema & sanity verification   │
 │ 4. Priority Agent     - Urgency & impact scoring       │
 │ 5. Recovery Agent     - Retry backoff & failure triage │
 │ 6. Monitoring Agent   - Timelines & real-time events   │
 └────────────────────────────────────────────────────────┘
         ↓
 RESPONSIBILITY ENGINE
         ↓
 DEADLINES + MISSING REQUIREMENTS (Completion %)
         ↓
 DEPENDENCIES + RELATIONSHIPS
         ↓
 PRIORITY CALCULATION (Explainable: "Why?")
         ↓
      LIFEOS
         ↓
 "What should I do now?" (Priority Action Command Center)
```

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Core**: React.js (v18+), Vite
- **Routing**: React Router DOM (v6+)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (with persistent auth)
- **Networking & Real-Time**: Axios, Socket.IO Client
- **Forms & Validation**: React Hook Form
- **Icons & UI**: Lucide React

### Backend (`/server`)
- **Runtime & Framework**: Node.js (v18+ / v20+), Express.js
- **Database**: MongoDB with Mongoose (*includes seamless In-Memory fallback for local dev*)
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` (cost factor 12)
- **Queues & Jobs**: BullMQ, Redis (via `ioredis`) (*includes in-memory queue fallback*)
- **Real-Time**: Socket.IO
- **Security & Utilities**: Helmet, Morgan, Compression, Multer, `express-validator`, `express-rate-limit`, `crypto` (AES-256 token encryption)

### AI Integration & Fallback
1. **Primary**: OpenRouter API (`OPENROUTER_API_KEY`)
2. **Secondary Fallback**: Google Generative AI SDK (`GEMINI_API_KEY`)
3. **Local Deterministic Fallback**: Built-in regex and rule-based extraction engine (functions even with zero API keys configured)
4. **AI Orchestration Readiness**: LangChain / LangGraph compatible

---

## 📁 Project Directory Structure

```
lifeos/
├── client/                               # Frontend Application (Vite + React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIChat/                   # Natural language assistant UI
│   │   │   ├── AppShell/                 # Main responsive layout & sidebar
│   │   │   ├── IntegrationCard/          # Gmail / Calendar OAuth cards
│   │   │   ├── LiveProcessingPanel/      # Real-time agent event monitor
│   │   │   ├── MetricGrid/               # Dashboard metric summary cards
│   │   │   ├── NotificationDrawer/       # Actionable notification panel
│   │   │   ├── PriorityAction/           # "What should I do now?" card
│   │   │   ├── ProcessingTimeline/       # Step-by-step pipeline view
│   │   │   ├── ProtectedRoute/           # Auth guard component
│   │   │   ├── ResponsibilityCard/       # Single responsibility item
│   │   │   └── ResponsibilityList/       # Filterable / sortable list
│   │   ├── hooks/
│   │   │   ├── useResponsibilities.js    # Data fetching & state hook
│   │   │   └── useSocket.js              # Socket.IO connection & listener hook
│   │   ├── pages/
│   │   │   ├── Activity.jsx              # System audit log & activity feed
│   │   │   ├── Assistant.jsx             # AI Chat Assistant interface
│   │   │   ├── Dashboard.jsx             # Command Center Dashboard
│   │   │   ├── Documents.jsx             # Document upload & text extractor
│   │   │   ├── Integrations.jsx          # OAuth Integrations management
│   │   │   ├── Landing.jsx               # Marketing / overview page
│   │   │   ├── Login.jsx                 # Login form
│   │   │   ├── Processing.jsx            # Processing runs history
│   │   │   ├── ProcessingDetails.jsx     # Deep agent timeline view
│   │   │   ├── Register.jsx              # User registration
│   │   │   ├── Responsibilities.jsx      # All responsibilities view
│   │   │   ├── ResponsibilityDetails.jsx # Detailed view with "Why?" & DAG
│   │   │   └── Settings.jsx              # Profile, security, AI health
│   │   ├── services/
│   │   │   ├── api.js                    # Configured Axios instance with JWT
│   │   │   └── socket.js                 # Socket.IO client instance
│   │   ├── store/
│   │   │   ├── authStore.js              # User auth state (Zustand)
│   │   │   ├── lifeOSStore.js            # Responsibilities & dashboard state
│   │   │   └── notificationStore.js      # Notifications state
│   │   ├── utils/
│   │   │   ├── dates.js                  # Timezone & deadline formatting
│   │   │   ├── priority.js               # Priority color & scoring helpers
│   │   │   └── status.js                 # Status badge styles
│   │   ├── App.jsx                       # Routing setup
│   │   ├── index.css                     # Tailwind CSS entry
│   │   └── main.jsx                      # React DOM entry
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                               # Backend Application (Node.js + Express)
│   ├── src/
│   │   ├── agents/                       # Pure AI Agent logic (no HTTP)
│   │   │   ├── extractionAgent.js        # Extracts tasks, dates, docs
│   │   │   ├── monitoringAgent.js        # Timeline logs & real-time events
│   │   │   ├── orchestrator.js           # Multi-agent coordinator
│   │   │   ├── priorityAgent.js          # Urgency & priority scoring
│   │   │   ├── recoveryAgent.js          # Error classification & retry backoff
│   │   │   ├── relationshipAgent.js      # Dependencies & duplicates
│   │   │   └── validationAgent.js        # Schema validation
│   │   ├── config/
│   │   │   ├── db.js                     # MongoDB connection & memory fallback
│   │   │   ├── env.js                    # Validated environment variables
│   │   │   └── socket.js                 # Socket.IO server initialization
│   │   ├── controllers/                  # Thin HTTP controllers
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── documentController.js
│   │   │   ├── integrationController.js
│   │   │   ├── processingController.js
│   │   │   ├── responsibilityController.js
│   │   │   └── sourceController.js
│   │   ├── integrations/                 # Base and provider integrations
│   │   │   ├── baseIntegration.js        # Standard interface
│   │   │   ├── calendarIntegration.js    # Google Calendar API client
│   │   │   └── gmailIntegration.js       # Gmail API client
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # JWT verification
│   │   │   ├── errorMiddleware.js        # Centralized error handler
│   │   │   ├── uploadMiddleware.js       # Multer upload handler (PDF/TXT)
│   │   │   └── validationMiddleware.js   # Request body validation
│   │   ├── models/                       # Mongoose schemas
│   │   │   ├── AgentMemory.js            # Long-term contextual memory
│   │   │   ├── Document.js               # Uploaded files & extracted text
│   │   │   ├── Integration.js            # Encrypted OAuth tokens
│   │   │   ├── Notification.js           # Persisted user alerts
│   │   │   ├── ProcessingLog.js          # Step-by-step execution logs
│   │   │   ├── ProcessingRun.js          # Pipeline execution state
│   │   │   ├── Responsibility.js         # Central obligation object
│   │   │   ├── Source.js                 # Raw email, event, or document
│   │   │   └── User.js                   # User profile & credentials
│   │   ├── queues/                       # BullMQ queue definitions
│   │   │   ├── documentQueue.js
│   │   │   ├── emailSyncQueue.js
│   │   │   ├── processingQueue.js
│   │   │   └── reminderQueue.js
│   │   ├── routes/                       # Express route definitions
│   │   │   ├── activityRoutes.js
│   │   │   ├── assistantRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   ├── integrationRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── processingRoutes.js
│   │   │   ├── responsibilityRoutes.js
│   │   │   └── sourceRoutes.js
│   │   ├── services/                     # Core business logic
│   │   │   ├── aiService.js              # OpenRouter -> Gemini -> Rule-based
│   │   │   ├── authService.js            # Password hashing & JWT issuance
│   │   │   ├── integrationService.js     # Token management & API calls
│   │   │   ├── notificationService.js    # Alert dispatching
│   │   │   ├── priorityService.js        # Explainable score calculation
│   │   │   ├── processingService.js      # Job dispatch & run tracking
│   │   │   ├── relationshipService.js    # Deduplication & graph detection
│   │   │   └── responsibilityService.js  # CRUD & status transitions
│   │   └── app.js                        # Express server entry point
│   ├── package.json
│   └── .env.example
├── README.md
└── spec.md                               # Project Specification (Single Source of Truth)
```

---

## 📦 Prerequisites

Before running LifeOS locally, ensure you have the following installed:

1. **Node.js**: `v18.18.0+` or `v20.x+` (Check via `node -v`)
2. **npm** (v9+) or **yarn** / **pnpm**
3. **MongoDB** *(Optional for basic dev)*: Local MongoDB instance (`mongodb://localhost:27017`) or [MongoDB Atlas](https://www.mongodb.com/atlas). *LifeOS includes an automatic in-memory fallback if no MongoDB is detected.*
4. **Redis** *(Optional for basic dev)*: Local Redis server (`redis://localhost:6379`) or [Upstash Redis](https://upstash.com/). *LifeOS includes an in-memory queue fallback.*
5. **Google Cloud Account** *(For Gmail & Google Calendar sync)*: To obtain OAuth 2.0 Client ID and Client Secret.
6. **AI API Key(s)** *(Optional)*:
   - [OpenRouter API Key](https://openrouter.ai/) (Primary AI Provider)
   - [Google Gemini API Key](https://aistudio.google.com/) (Fallback AI Provider)
   *Note: If no AI keys are provided, LifeOS automatically operates using its built-in rule-based extraction engine.*

---

## 🚀 Step-by-Step Local Setup

### 1. Clone and Navigate

```bash
git clone <your-repo-url> lifeos
cd lifeos
```

---

### 2. Backend Configuration & Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create the backend environment file:
   ```bash
   cp .env.example .env
   ```
   *(Or create a new `.env` file in the `server/` directory)*

4. Configure your `.env` variables (see [Environment Variables](#-environment-variables) below).

5. Generate a secure 32-byte encryption key for `CREDENTIAL_ENCRYPTION_KEY`:
   ```bash
   # On Linux / macOS / Git Bash:
   openssl rand -hex 32

   # Or in Node.js REPL:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start at **`http://localhost:5000`**. You should see:
   ```
   [Database] MongoDB connected (or In-Memory Fallback initialized)
   [Queues] BullMQ connected to Redis (or In-Memory Queue fallback active)
   [Server] LifeOS Backend listening on port 5000
   ```

---

### 3. Frontend Configuration & Setup

1. Open a new terminal window and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create the frontend `.env` file:
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` contains:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the frontend Vite development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at **`http://localhost:5173`**.

---

### 4. Optional Services (MongoDB & Redis)

If you have Docker installed, you can start MongoDB and Redis with a single command:

```bash
# Run MongoDB
docker run -d --name lifeos-mongo -p 27017:27017 mongo:latest

# Run Redis
docker run -d --name lifeos-redis -p 6379:6379 redis:alpine
```

*If you don't use Docker or local services, LifeOS will gracefully fall back to its internal in-memory mock storage and synchronous processing engine for rapid zero-dependency prototyping.*

---

### 5. Connecting Your Real Gmail Account

LifeOS supports two methods to connect and sync your real Gmail emails:

#### Method A: Google App Password (Instant & Zero Cloud Setup — Recommended)
1. Ensure **2-Step Verification** is turned ON for your Google account at [myaccount.google.com/security](https://myaccount.google.com/security).
2. Go to **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**.
3. Enter `LifeOS` as the app name and click **Create**.
4. Copy the generated 16-letter password (e.g. `abcd efgh ijkl mnop`).
5. Open LifeOS at `http://localhost:5173/integrations`, click **Connect Real Gmail**, enter your Gmail address and 16-character password, and click **Connect & Sync Real Gmail**.
   LifeOS will securely connect to `imap.gmail.com:993` over TLS, sync your live inbox emails, and process real obligations with AI!

#### Method B: Google Cloud OAuth 2.0 (Official Google Sign-in Popup)
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **LifeOS Local**.
3. Navigate to **APIs & Services $\to$ Library** and enable:
   - **Gmail API**
   - **Google Calendar API**
4. Navigate to **APIs & Services $\to$ OAuth consent screen**:
   - User Type: **External**
   - App Name: `LifeOS`
   - User support email: `your-email@gmail.com`
   - Add Scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Add your test Google accounts under **Test users**.
5. Navigate to **APIs & Services $\to$ Credentials**:
   - Click **Create Credentials $\to$ OAuth Client ID**.
   - Application type: **Web application**.
   - Name: `LifeOS Web Client`.
   - Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:5000`
   - Authorized redirect URIs: `http://localhost:5000/api/integrations/oauth/google/callback`
6. Copy the **Client ID** and **Client Secret** into your `server/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/google/callback
   ```
   Or enter them directly via the **OAuth Keys** button on the `/integrations` page.

---

### 6. AI Providers Setup

LifeOS utilizes a hierarchical AI fallback strategy:

1. **OpenRouter (Recommended)**:
   - Sign up at [OpenRouter.ai](https://openrouter.ai/).
   - Create an API key and add it to `server/.env`:
     ```env
     OPENROUTER_API_KEY=sk-or-v1-...
     ```
2. **Google Gemini (Secondary Fallback)**:
   - Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
   - Add it to `server/.env`:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
3. **Deterministic Fallback (Always Ready)**:
   - If neither API key is present or if both providers encounter rate limits/network outages, LifeOS automatically runs the local rule-based extraction engine to extract tasks, dates, and deadlines with no downtime.

---

## 🔐 Environment Variables

### Server (`server/.env`)

| Variable | Required? | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port for Express server |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Frontend URL for CORS & redirects |
| `MONGODB_URI` | No | `mongodb://localhost:27017/lifeos` | MongoDB connection string (falls back to memory if blank) |
| `JWT_SECRET` | Yes | `your_super_secret_jwt_key_here` | Secret key used to sign and verify JWT tokens |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis URL for BullMQ (falls back to memory if blank) |
| `CREDENTIAL_ENCRYPTION_KEY` | Yes | `64_char_hex_string` | 32-byte (64 hex characters) key for AES token encryption |
| `GOOGLE_CLIENT_ID` | Optional | `your_client_id.apps.googleusercontent.com` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | `GOCSPX-...` | Google OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | Optional | `http://localhost:5000/api/integrations/oauth/google/callback` | OAuth redirect callback URL |
| `OPENROUTER_API_KEY` | Optional | `sk-or-v1-...` | Primary AI provider API key |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Fallback AI provider API key |

### Client (`client/.env`)

| Variable | Required? | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | REST API base endpoint |
| `VITE_SOCKET_URL` | Yes | `http://localhost:5000` | Socket.IO server URL |

---

## 🏃 Running the Application

### Option A: Running Backend & Frontend in Separate Terminals

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

### Option B: Running Concurrently from Root (if configured)

```bash
npm run dev
```

### Accessing the App

1. Open your browser at **`http://localhost:5173`**.
2. Click **Get Started** or **Register** to create a local account.
3. Once logged in, you'll be redirected to the **Dashboard** (`/dashboard`).
4. Test document ingestion by navigating to **Documents** (`/documents`) and uploading a sample syllabus, invoice, or appointment confirmation (PDF or TXT).
5. Watch the **Live Processing Panel** and **Processing Timeline** in real time as the agents analyze the document!

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 🩺 Health
- `GET /api/health` — System heartbeat, database connection, queue status, and AI provider availability.

### 🔑 Authentication
- `POST /api/auth/register` — Create new user (`name`, `email`, `password`).
- `POST /api/auth/login` — Authenticate and receive JWT cookie/token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/logout` — Invalidate session and clear auth state.

### 📊 Dashboard
- `GET /api/dashboard` — Aggregated metrics, priority action, urgent items, upcoming calendar events, and recent activity.

### 🎯 Responsibilities
- `GET /api/responsibilities` — List obligations with filtering (`status`, `priority`, `category`, `search`), sorting, and pagination.
- `POST /api/responsibilities` — Manually create a responsibility.
- `GET /api/responsibilities/:id` — Detailed view (requirements %, dependencies DAG, source references, AI confidence).
- `PUT /api/responsibilities/:id` — Update responsibility fields.
- `DELETE /api/responsibilities/:id` — Delete a responsibility.
- `POST /api/responsibilities/:id/status` — Transition status (`NOT_STARTED`, `IN_PROGRESS`, `WAITING`, `BLOCKED`, `COMPLETED`, `OVERDUE`, `CANCELLED`).
- `POST /api/responsibilities/:id/duplicate` — Duplicate or merge responsibility records.
- `GET /api/responsibilities/:id/explain-priority` — Returns AI/rule explainability ("Why is this urgent?").

### 📥 Sources
- `GET /api/sources` — List ingested sources (emails, calendar events, documents).
- `GET /api/sources/:id` — Get source details and raw content.
- `POST /api/sources/:id/process` — Trigger or re-trigger AI agent pipeline processing.
- `DELETE /api/sources/:id` — Delete source and unlink associations.

### ⚙️ Processing & Agent Pipeline
- `GET /api/processing` — List processing runs with statuses and durations.
- `GET /api/processing/:id` — View processing run snapshot, input, and output.
- `GET /api/processing/:id/timeline` — Detailed agent-by-agent step logs (`ProcessingLog`).
- `POST /api/processing/:id/pause` — Pause a running pipeline job.
- `POST /api/processing/:id/resume` — Resume a paused job.
- `POST /api/processing/:id/cancel` — Cancel an in-flight processing run.

### 🔗 Integrations (Gmail & Google Calendar)
- `GET /api/integrations` — Status of all connected providers.
- `GET /api/integrations/gmail/start` — Initiate Gmail OAuth flow.
- `GET /api/integrations/gmail/callback` — OAuth callback handler.
- `POST /api/integrations/gmail/sync` — Trigger immediate email fetch and ingestion.
- `DELETE /api/integrations/gmail` — Disconnect Gmail and wipe encrypted tokens.
- `GET /api/integrations/calendar/start` — Initiate Google Calendar OAuth flow.
- `GET /api/integrations/calendar/callback` — Calendar OAuth callback handler.
- `POST /api/integrations/calendar/sync` — Sync upcoming calendar events.
- `DELETE /api/integrations/calendar` — Disconnect Calendar.

### 📄 Documents
- `POST /api/documents/upload` — Upload file (`multipart/form-data`, PDF/TXT up to 10MB).
- `GET /api/documents` — List uploaded documents and parsing statuses.
- `GET /api/documents/:id` — Get document text extraction and linked responsibilities.
- `POST /api/documents/:id/process` — Rerun extraction pipeline on document.
- `DELETE /api/documents/:id` — Remove uploaded document.

### 💬 AI Assistant
- `POST /api/assistant/query` — Ask natural language questions with contextual evidence grounding:
  - *"What should I do today?"*
  - *"What is due this week?"*
  - *"Which responsibilities are blocked?"*
  - *"What documents are missing?"*

### 🔔 Notifications & Activity
- `GET /api/notifications` — List persistent alerts and deadline reminders.
- `PUT /api/notifications/:id/read` — Mark notification as read.
- `PUT /api/notifications/read-all` — Mark all notifications as read.
- `GET /api/activity` — Timeline audit feed of all platform events.

---

## 🤖 AI Fallback & Agent Pipeline

### Cooperating Agents Workflow

1. **Extraction Agent**: Parses raw unstructured text to extract tasks, dates, deadlines, requirements, and people into structured JSON.
2. **Relationship Agent**: Identifies cross-source dependencies (`REQUIRES`, `BLOCKS`, `REQUIRED_BEFORE`, `FOLLOWS`, `PART_OF`, `RELATED_TO`) and flags duplicate responsibilities.
3. **Validation Agent**: Sanitizes dates, prevents hallucinated fields, and validates required schemas.
4. **Priority Agent**: Computes `priorityScore` via:
   $$\text{Priority Score} = \text{Deadline Urgency} + \text{Dependency Impact} + \text{Missing Requirements} + \text{Importance} + \text{Overdue Penalty}$$
5. **Recovery Agent**: Classifies runtime errors (`MISSING_FIELDS`, `AI_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`) and initiates exponential backoff retries.
6. **Monitoring Agent**: Emits real-time Socket.IO events and persists audit logs (`ProcessingLog`).

### Real-Time Socket.IO Events

The frontend automatically listens to the following events:
- `SOURCE_RECEIVED`
- `EXTRACTION_STARTED`
- `TASKS_EXTRACTED`
- `DEADLINES_DETECTED`
- `RELATIONSHIP_ANALYSIS_STARTED`
- `PRIORITY_CALCULATED`
- `PROCESSING_COMPLETED`
- `PROCESSING_FAILED`

---

## ⚠️ Error Codes Reference

LifeOS returns explicit semantic error codes:

| Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `AUTH_REQUIRED` | `401` | Missing authorization token in request |
| `AUTH_INVALID` | `401` | Invalid or malformed JWT token |
| `AUTH_EXPIRED` | `401` | JWT or OAuth access token expired |
| `INTEGRATION_NOT_CONNECTED` | `400` | Action requested on an unlinked third-party account |
| `RATE_LIMIT` | `429` | Too many requests sent to the endpoint |
| `AI_SERVICE_UNAVAILABLE` | `503` | All AI providers down & rule engine failed |
| `AI_INVALID_RESPONSE` | `502` | AI model returned unparseable or corrupted JSON |
| `DOCUMENT_PARSE_FAILURE` | `422` | PDF/TXT file corrupted or unreadable |
| `PROCESSING_FAILED` | `500` | Unrecoverable error in agent pipeline |
| `MISSING_FIELDS` | `400` | Mandatory payload fields missing |
| `NOT_FOUND` | `404` | Requested entity does not exist |
| `VALIDATION_ERROR` | `422` | Request body failed express-validator checks |

---

## 🗺️ Development Phases

- [x] **Phase 1 — Foundation**: React client, Express backend, MongoDB with memory fallback, JWT auth, Zustand store, AppShell.
- [x] **Phase 2 — Responsibility Management**: CRUD, status engine, categories, priority badges, Dashboard metrics.
- [x] **Phase 3 — AI Extraction**: OpenRouter provider, Gemini fallback, Rule-based engine, structured parsing.
- [x] **Phase 4 — Agent Orchestration**: Multi-agent chain, pipeline lifecycle (`PENDING` $\to$ `COMPLETED`).
- [x] **Phase 5 — Gmail OAuth**: OAuth 2.0 flow, token encryption, email sync, and ingestion.
- [x] **Phase 6 — Calendar Integration**: Google Calendar OAuth, appointment & deadline detection.
- [x] **Phase 7 — Background Jobs**: BullMQ, Redis, retry backoff, in-memory queue fallback.
- [x] **Phase 8 — Real-Time System**: Socket.IO live streaming, timeline component, notification drawer.
- [x] **Phase 9 — Documents**: Upload handler, text extraction, obligation parsing.
- [x] **Phase 10 — Intelligence**: Dependency DAG graph, duplicate detection, missing requirements calculation, priority explainability.
- [x] **Phase 11 — AI Assistant**: Context-aware natural language Q&A, evidence references.
- [x] **Phase 12 — Production Polish**: Security hardening, error handling, responsive UI/UX.

---

## 🛡️ Security Best Practices

- 🔒 **Password Hashing**: Passwords hashed with `bcryptjs` using cost factor `12`.
- 🔑 **Credential Encryption**: All OAuth refresh and access tokens encrypted at rest using AES-256 with `CREDENTIAL_ENCRYPTION_KEY`.
- 🛡️ **Headers & CORS**: HTTP security headers enforced by `helmet`; CORS restricted to `CLIENT_URL`.
- 🚦 **Rate Limiting**: Auth endpoints protected against brute-force attacks with `express-rate-limit`.
- 🙈 **Zero Secret Exposure**: Tokens and API keys are strictly kept server-side in `process.env` and never leaked to the client or log files.
