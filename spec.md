Project Overview & Tech Stack
Project Overview

Build a full-stack AI-powered Personal Obligation Intelligence Platform called LifeOS.

LifeOS connects fragmented information from a user's digital life—including Gmail, Google Calendar, and uploaded documents—and transforms that information into a continuously updated understanding of:

Responsibilities
Tasks
Deadlines
Appointments
Payments
Required documents
Missing requirements
Dependencies
Priorities
Recommended next actions

The platform must automatically analyze incoming information using cooperating AI processing agents.

Instead of asking users to manually create every task, LifeOS must answer:

What do I need to do, why does it matter, and what should I do first?

The platform must:

Support secure user authentication
Connect Gmail through OAuth
Connect Google Calendar through OAuth
Accept uploaded documents
Extract text and structured information
Detect responsibilities automatically
Detect deadlines and appointments
Detect requirements
Connect related information
Detect duplicates
Detect dependencies
Detect blocked responsibilities
Calculate priority scores
Generate recommended actions
Process information in background jobs
Retry failed processing jobs
Stream processing events to the frontend
Maintain a complete activity timeline
Maintain AI confidence information
Store notifications
Support AI-powered questions
Provide a working deployed application
Core LifeOS Workflow
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
 BACKGROUND PROCESSING
         ↓
 ┌────────────────────────┐
 │   LIFEOS AI AGENTS     │
 ├────────────────────────┤
 │ Extraction Agent       │
 │ Relationship Agent     │
 │ Validation Agent       │
 │ Priority Agent         │
 │ Recovery Agent         │
 │ Monitoring Agent       │
 └────────────────────────┘
         ↓
 RESPONSIBILITY ENGINE
         ↓
 DEADLINES + REQUIREMENTS
         ↓
 DEPENDENCIES + RELATIONSHIPS
         ↓
 PRIORITY CALCULATION
         ↓
      LIFEOS
         ↓
"What should I do now?"
Tech Stack
Frontend
React.js
Vite
React Router DOM
Tailwind CSS
Zustand
Axios
Socket.IO Client
Lucide React
React Hook Form
Backend
Node.js
Express.js
MongoDB
Mongoose
JSON Web Tokens
bcryptjs
BullMQ
Redis via ioredis
Socket.IO
Multer
Helmet
Morgan
Compression
express-validator
express-rate-limit
AI Integration

Primary:

OpenRouter API

Fallback:

Google Generative AI SDK

Local fallback:

Deterministic rule-based extraction engine

The system must continue to perform basic extraction even if no AI API is configured.

AI Orchestration
LangChain available
LangGraph available

The system must report:

langGraph: "available"

or:

langGraph: "not-installed"

with every processing run.

Integrations
Gmail API
Google Calendar API
Google OAuth 2.0

Sensitive OAuth credentials must be encrypted at rest.

Authentication and User Management
Authentication

The authentication system must support:

User registration
User login
JWT-based authentication
Protected routes
/auth/me endpoint
Persistent login state
Logout
Password validation
Secure error handling

Passwords must use:

bcrypt
cost factor: 12
User Roles
User

Can:

Connect accounts
Upload documents
Process information
Manage responsibilities
Ask LifeOS questions
Admin

Optional platform-level role.

Can:

View system health
Monitor processing metrics
Manage users
Information Source Management

LifeOS treats every incoming item as a:

Source

A Source can be:

EMAIL
CALENDAR_EVENT
DOCUMENT
MANUAL_INPUT

Every source must store:

Owner
Source type
External ID
Title
Content
Metadata
Source date
Processing status
Processing confidence
Created date
Gmail Integration
OAuth Flow
User
 ↓
Connect Gmail
 ↓
Google Login
 ↓
User Consent
 ↓
OAuth Callback
 ↓
Encrypt Tokens
 ↓
Store Connection
 ↓
Gmail Connected

LifeOS must:

Never request Gmail passwords
Never expose OAuth secrets in frontend code
Encrypt access tokens
Encrypt refresh tokens
Gmail Features

Support:

Connect Gmail
Disconnect Gmail
Reconnect Gmail
Connection status
Token validity check
Fetch recent emails
Fetch selected emails
Read email threads
Process emails
Trigger synchronization
Integration Errors

The system must explicitly return:

INTEGRATION_NOT_CONNECTED

or:

AUTH_EXPIRED

Never silently fail.

Google Calendar Integration

LifeOS must support:

OAuth connection
Disconnect
Reconnect
Connection status
Fetch events
Fetch upcoming events
Process appointments
Detect deadlines
Connect events with responsibilities
Document Processing

Supported MVP formats:

PDF
TXT

Optional:

DOCX
Images
Document Workflow
Upload
 ↓
Store Metadata
 ↓
Extract Text
 ↓
Create Processing Job
 ↓
AI Extraction
 ↓
Validation
 ↓
Responsibility Detection
 ↓
Relationship Detection
 ↓
Dashboard Update
AI Agentic Processing System

LifeOS must use a fixed chain of cooperating processing agents.

1. Extraction Agent

Responsible for extracting:

Tasks
Responsibilities
Deadlines
Dates
Times
Appointments
Payments
Required documents
People
Instructions

It must return structured JSON.

2. Relationship Agent

Responsible for determining:

Related responsibilities
Duplicate responsibilities
Parent-child relationships
Requirements
Dependencies

Example:

Get Marks Memo
        ↓
Submit Application
        ↓
Attend Interview
3. Validation Agent

Responsible for checking:

Required fields
Invalid dates
Invalid deadlines
Empty titles
Duplicate results
Invalid AI output
4. Priority Agent

Responsible for calculating:

Urgency
Importance
Deadline risk
Dependency impact
Missing requirement impact

Output:

CRITICAL
HIGH
MEDIUM
LOW
5. Recovery Agent

Responsible for classifying failures:

MISSING_FIELDS
AI_FAILURE
API_FAILURE
AUTH_EXPIRED
RATE_LIMIT
TRANSIENT
DOCUMENT_PARSE_FAILURE

The Recovery Agent decides:

retry_with_backoff

or:

escalate
6. Monitoring Agent

Responsible for:

Creating processing timeline events
Recording agent activity
Recording processing duration
Emitting real-time events
Creating notifications
AI Processing Lifecycle

Every processing run must have one of these statuses:

PENDING
QUEUED
RUNNING
COMPLETED
FAILED
RETRYING
PAUSED
CANCELLED

Each run must store:

Source ID
Processing snapshot
Status
Current agent
Start time
End time
Duration
Input
Output
Error
Retry count
Background Processing System

LifeOS must process large workloads asynchronously.

Use:

BullMQ + Redis

For:

Email synchronization
Email processing
Document processing
Relationship analysis
Priority recalculation
Reminder generation
Retry System

Failed jobs must support retry backoff.

Example:

Attempt 1 → Failed
       ↓
Wait
       ↓
Attempt 2
       ↓
Wait
       ↓
Attempt 3

If Redis is unavailable:

In-memory fallback

must allow local development to continue.

Responsibility Engine

The central LifeOS object is:

Responsibility

A Responsibility represents something a user needs to:

Do
Submit
Attend
Pay
Prepare
Review
Complete
Responsibility Fields
owner
title
description
category
status
priority
priorityScore
deadline
requirements
missingRequirements
dependencies
relatedResponsibilities
sourceIds
people
confidenceScore
createdAt
updatedAt
Responsibility Status
NOT_STARTED
IN_PROGRESS
WAITING
BLOCKED
COMPLETED
OVERDUE
CANCELLED
Responsibility Categories
EDUCATION
WORK
FINANCE
PERSONAL
HEALTH
GOVERNMENT
TRAVEL
SHOPPING
OTHER
Requirement Engine

LifeOS must detect required items.

Example:

Internship Application

Required:

✓ Resume
✓ ID Proof
✗ Marks Memo
✓ Photograph

The system must calculate:

completionPercentage

Example:

3 / 4 requirements complete
75%
Missing Requirement Detection

If a required item is not available or marked complete:

Missing Requirement

must be created.

If a missing requirement prevents another action:

BLOCKED

status must be suggested.

Dependency Engine

LifeOS must support relationships:

REQUIRES
BLOCKS
REQUIRED_BEFORE
FOLLOWS
PART_OF
RELATED_TO

Example:

Marks Memo
     │
     ▼
Application Submission
     │
     ▼
Interview
Related Information Engine

The system must determine whether sources are:

SAME_RESPONSIBILITY
RELATED
DUPLICATE
UNRELATED

Confidence scores must be stored.

Low-confidence relationships should not automatically merge critical data without user review.

Deadline Engine

The system must detect:

Exact dates
September 5
Relative dates
Tomorrow
Next Friday
Within 7 days
Time instructions
Before 5 PM
Deadline Status
UPCOMING
APPROACHING
URGENT
OVERDUE

Deadline calculations must use the user's configured timezone where available.

Priority Engine

LifeOS must calculate:

priorityScore

using factors such as:

Days remaining
Overdue status
Number of missing requirements
Dependency impact
Blocked status
Manual importance
Suggested Priority Formula
Priority Score
=
Deadline Urgency
+
Dependency Impact
+
Missing Requirements
+
Importance
+
Overdue Penalty

The exact formula may evolve, but the calculation must be explainable.

Explainability

Every AI recommendation must support:

Why?

Example:

Why is this urgent?

Response:

The deadline is tomorrow and one required document is still missing.

LifeOS should not provide unexplained priority decisions.

AI Fallback Strategy

The AI processing system must use:

1. OpenRouter
        ↓
2. Gemini
        ↓
3. Rule-Based Engine
Rule-Based Engine

Must support basic detection for:

Common dates
"Due"
"Before"
"Submit"
"Pay"
"Attend"
"Bring"
"Upload"

Even without AI APIs, the system should produce a basic working result.

Real-Time Layer

Socket.IO must stream processing events.

Example:

SOURCE_RECEIVED

EXTRACTION_STARTED

TASKS_EXTRACTED

DEADLINES_DETECTED

RELATIONSHIP_ANALYSIS_STARTED

PRIORITY_CALCULATED

PROCESSING_COMPLETED

The frontend must display these events live.

Processing Timeline

Each processing run must create:

ProcessingLog

Fields:

processingRunId
sourceId
agent
level
message
metadata
createdAt
Agent Values
EXTRACTION
RELATIONSHIP
VALIDATION
PRIORITY
RECOVERY
MONITORING
Log Levels
INFO
WARNING
ERROR
SUCCESS
Notifications

LifeOS must persist notifications.

Examples:

Urgent deadline
New responsibility detected
Requirement missing
Responsibility blocked
Processing failed
Connection expired
Notification Fields
owner
responsibilityId
processingRunId
type
title
message
isRead
createdAt
AI Memory / Context

LifeOS must maintain contextual memory.

Collection:

AgentMemory

Stores:

owner
responsibilityId
processingRunId
key
value
confidenceScore
createdAt

Example:

Internship
→ Related organization
→ Known deadline
→ Required documents

This helps later information connect to earlier information.

Natural Language Assistant

Users can ask:

What should I do today?

What is due this week?

Which responsibilities are blocked?

What am I waiting for?

What documents are missing?

Why is this task urgent?

The assistant must:

Use stored LifeOS data
Avoid hallucinating
Return uncertainty when information is incomplete
Provide evidence references where possible
Dashboard

The main dashboard must answer:

WHAT SHOULD I DO NOW?
Dashboard Sections
Priority Action

The single most important recommendation.

Urgent

Critical responsibilities.

Today

Actions requiring attention today.

Upcoming

Future deadlines.

Blocked

Responsibilities that cannot proceed.

Missing

Requirements not completed.

Calendar

Upcoming appointments.

Recent Activity

Recent LifeOS changes.

Dashboard Metrics
Active Responsibilities

Critical

Due This Week

Blocked

Missing Requirements

Completed This Week
Frontend Pages
/

Landing page.

Must include:

Product introduction
Problem explanation
How LifeOS works
AI processing visualization
Key features
CTA
Responsive layout
Dark mode support

Authenticated users should redirect to:

/dashboard

Unauthenticated users should redirect to:

/login
/login

Features:

Email
Password
Validation
Error states
JWT handling
Zustand persistence
/register

Features:

Name
Email
Password
Password validation
Error handling
/dashboard

Must include:

AppShell
MetricGrid
Priority Action
Responsibility statistics
Recent processing summaries
AI activity feed
Live processing panel
/responsibilities

Features:

List responsibilities
Search
Filter
Sort
Pagination

Filters:

Status
Priority
Category
Deadline
Source
/responsibilities/:id

Shows:

Responsibility information
Priority explanation
Deadline
Requirements
Missing requirements
Dependencies
Related responsibilities
Source information
Activity timeline
AI confidence
/processing

List processing runs.

Features:

Status badges
Duration
Source
Timeline
Logs
Filter
Sort
Pagination
Live updates
/processing/:id

Full processing timeline.

Shows:

Extraction Agent
        ↓
Relationship Agent
        ↓
Validation Agent
        ↓
Priority Agent
        ↓
Recovery Agent
        ↓
Monitoring Agent
/integrations

Shows:

Gmail
Google Calendar

For each:

Connected
Disconnected
Expired
Reconnecting

Must support:

OAuth connection
Disconnect
Reconnect
Health check
/documents

Features:

Upload document
Processing status
Extracted text
Extracted responsibilities
Delete document
/assistant

AI chat interface.

Features:

Ask LifeOS questions
Suggested questions
Context-aware responses
Evidence-backed answers
/activity

Shows:

Responsibility detected
Deadline detected
Requirement added
Dependency detected
Priority changed
Status changed
Processing completed
/settings

Features:

Profile
Connected accounts
Notification preferences
Security settings
AI provider health
Encryption key health
Theme settings
Backend Architecture
Routes
   ↓
Controllers
   ↓
Services
   ↓
Agents Layer
   ↓
Integration Layer
   ↓
Queue Layer
   ↓
Models
   ↓
MongoDB
Architecture Rules
Routes

Responsible for:

HTTP routing
Validation
Middleware
Controllers

Responsible only for:

Request parsing
Calling services
Response shaping
Controllers must never directly access MongoDB.
Services

Responsible for:

Business logic
Responsibility management
Processing lifecycle
Priority calculation
Notifications
AI provider selection
Agents Layer

Contains:

orchestrator.js
extractionAgent.js
relationshipAgent.js
validationAgent.js
priorityAgent.js
recoveryAgent.js
monitoringAgent.js

Agents must not contain HTTP knowledge.

Integrations Layer

Every integration must implement:

baseIntegration.js

Examples:

gmailIntegration.js
calendarIntegration.js

Agents must not directly call integrations.

They must go through:

Integration Service
Queue Layer

Contains:

processingQueue.js
emailSyncQueue.js
documentQueue.js
reminderQueue.js

Uses:

BullMQ
Redis

with in-memory fallback.

Database Collections
Users
name
email
password
role
lastLogin
createdAt

Password must use:

select: false
Responsibilities
owner
title
description
category
status
priority
priorityScore
deadline
requirements
missingRequirements
dependencies
relatedResponsibilities
sourceIds
confidenceScore
createdAt
updatedAt
Sources
owner
type
externalId
title
content
metadata
sourceDate
processingStatus
aiProcessed
ProcessingRuns
sourceId
owner
status
currentAgent
snapshot
input
output
error
retryCount
startTime
endTime
duration
ProcessingLogs
processingRunId
sourceId
agent
level
message
metadata
createdAt
Integrations
owner
provider
isConnected
scopes
encryptedAccessToken
encryptedRefreshToken
expiresAt

Providers:

gmail
google-calendar
openrouter
gemini
Documents
owner
fileName
filePath
fileType
extractedText
processingStatus
uploadedAt
Notifications
owner
responsibilityId
processingRunId
type
title
message
isRead
createdAt
AgentMemory
owner
responsibilityId
processingRunId
key
value
confidenceScore
API Endpoints
Health
GET /api/health

System heartbeat and dependency status.

Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
Dashboard
GET /api/dashboard

Returns aggregated LifeOS statistics.

Responsibilities
GET    /api/responsibilities
POST   /api/responsibilities
GET    /api/responsibilities/:id
PUT    /api/responsibilities/:id
DELETE /api/responsibilities/:id

Additional:

POST /api/responsibilities/:id/status

POST /api/responsibilities/:id/duplicate

GET /api/responsibilities/:id/explain-priority
Sources
GET /api/sources

GET /api/sources/:id

POST /api/sources/:id/process

DELETE /api/sources/:id
Processing
GET /api/processing

GET /api/processing/:id

GET /api/processing/:id/timeline

POST /api/processing/:id/pause

POST /api/processing/:id/resume

POST /api/processing/:id/cancel
Gmail Integration
GET /api/integrations/gmail/start

GET /api/integrations/gmail/callback

POST /api/integrations/gmail/sync

GET /api/integrations/gmail/status

DELETE /api/integrations/gmail
Google Calendar Integration
GET /api/integrations/calendar/start

GET /api/integrations/calendar/callback

POST /api/integrations/calendar/sync

GET /api/integrations/calendar/status

DELETE /api/integrations/calendar
General Integration API
GET /api/integrations

GET /api/integrations/status

GET /api/integrations/oauth/:provider/start

GET /api/integrations/oauth/:provider/callback

GET /api/integrations/oauth/error
Documents
POST /api/documents/upload

GET /api/documents

GET /api/documents/:id

POST /api/documents/:id/process

DELETE /api/documents/:id
AI Assistant
POST /api/assistant/query
Notifications
GET /api/notifications

PUT /api/notifications/:id/read

PUT /api/notifications/read-all
Activity
GET /api/activity
Frontend Folder Structure
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── MetricGrid/
    │   ├── PriorityAction/
    │   ├── ResponsibilityCard/
    │   ├── ResponsibilityList/
    │   ├── ProcessingTimeline/
    │   ├── LiveProcessingPanel/
    │   ├── IntegrationCard/
    │   ├── NotificationDrawer/
    │   ├── AIChat/
    │   └── ProtectedRoute/
    │
    ├── pages/
    │   ├── Landing.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx
    │   ├── Responsibilities.jsx
    │   ├── ResponsibilityDetails.jsx
    │   ├── Processing.jsx
    │   ├── ProcessingDetails.jsx
    │   ├── Integrations.jsx
    │   ├── Documents.jsx
    │   ├── Assistant.jsx
    │   ├── Activity.jsx
    │   └── Settings.jsx
    │
    ├── store/
    │   ├── authStore.js
    │   ├── lifeOSStore.js
    │   └── notificationStore.js
    │
    ├── services/
    │   ├── api.js
    │   └── socket.js
    │
    ├── hooks/
    │   ├── useResponsibilities.js
    │   └── useSocket.js
    │
    ├── utils/
    │   ├── dates.js
    │   ├── priority.js
    │   └── status.js
    │
    ├── App.jsx
    └── main.jsx
Backend Folder Structure
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── responsibilityRoutes.js
    │   ├── sourceRoutes.js
    │   ├── processingRoutes.js
    │   ├── integrationRoutes.js
    │   ├── documentRoutes.js
    │   ├── assistantRoutes.js
    │   └── notificationRoutes.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── dashboardController.js
    │   ├── responsibilityController.js
    │   ├── sourceController.js
    │   ├── processingController.js
    │   └── integrationController.js
    │
    ├── services/
    │   ├── authService.js
    │   ├── responsibilityService.js
    │   ├── processingService.js
    │   ├── priorityService.js
    │   ├── relationshipService.js
    │   ├── integrationService.js
    │   ├── notificationService.js
    │   └── aiService.js
    │
    ├── agents/
    │   ├── orchestrator.js
    │   ├── extractionAgent.js
    │   ├── relationshipAgent.js
    │   ├── validationAgent.js
    │   ├── priorityAgent.js
    │   ├── recoveryAgent.js
    │   └── monitoringAgent.js
    │
    ├── integrations/
    │   ├── baseIntegration.js
    │   ├── gmailIntegration.js
    │   └── calendarIntegration.js
    │
    ├── queues/
    │   ├── processingQueue.js
    │   ├── emailSyncQueue.js
    │   ├── documentQueue.js
    │   └── reminderQueue.js
    │
    ├── models/
    │   ├── User.js
    │   ├── Responsibility.js
    │   ├── Source.js
    │   ├── ProcessingRun.js
    │   ├── ProcessingLog.js
    │   ├── Integration.js
    │   ├── Document.js
    │   ├── Notification.js
    │   └── AgentMemory.js
    │
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── validationMiddleware.js
    │   ├── errorMiddleware.js
    │   └── uploadMiddleware.js
    │
    └── app.js
Development Phases
Phase 1 — Foundation

Build:

React frontend
Express backend
MongoDB
In-memory fallback
JWT authentication
Zustand auth store
AppShell
Phase 2 — Responsibility Management

Build:

Responsibility CRUD
Status system
Categories
Priority display
Dashboard basics
Phase 3 — AI Extraction

Build:

OpenRouter provider
Gemini fallback
Rule-based fallback
Structured extraction
Phase 4 — Agent Orchestration

Build:

Extraction Agent
Relationship Agent
Validation Agent
Priority Agent
Recovery Agent
Monitoring Agent
Processing lifecycle
Phase 5 — Gmail OAuth

Build:

OAuth
Credential encryption
Email sync
Email processing
Phase 6 — Calendar Integration

Build:

OAuth
Event synchronization
Appointment detection
Phase 7 — Background Jobs

Build:

BullMQ
Redis
Retry logic
Backoff
In-memory fallback
Phase 8 — Real-Time System

Build:

Socket.IO
Live processing events
Timeline
Notifications
Phase 9 — Documents

Build:

Upload
PDF parsing
Processing
Responsibility extraction
Phase 10 — Intelligence

Build:

Relationship detection
Duplicate detection
Dependencies
Missing requirements
Priority explanation
Phase 11 — AI Assistant

Build:

Natural language questions
Context retrieval
Evidence-backed answers
Phase 12 — Production Polish

Build:

Testing
Error handling
Loading states
Deployment
README
Demo video
UI and UX Requirements

The UI must feel like:

A calm personal intelligence command center

Not a complicated enterprise dashboard.

Required UI Features
Fully responsive
Dark mode
Light mode
Loading states
Skeleton loaders
Empty states
Error states
Success feedback
Live processing indicators
Clear status badges
Notification drawer
Processing UI

The frontend must visually show:

● Extraction
       ↓
● Relationship Analysis
       ↓
● Validation
       ↓
● Priority Calculation
       ↓
● Completed

Live events must appear through Socket.IO.

Security Requirements

The application must:

Hash passwords with bcrypt cost factor 12
Sign and verify JWTs using JWT_SECRET
Encrypt OAuth access tokens
Encrypt refresh tokens
Use CREDENTIAL_ENCRYPTION_KEY
Use Helmet
Restrict CORS to CLIENT_URL
Rate-limit authentication endpoints
Validate every request body
Never log decrypted tokens
Never expose API keys in frontend code
Never commit .env
Isolate every user's data
Explicitly handle expired credentials
Environment Variables
PORT=5000

NODE_ENV=development

CLIENT_URL=http://localhost:5173

MONGODB_URI=

JWT_SECRET=

REDIS_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

OPENROUTER_API_KEY=
GEMINI_API_KEY=

CREDENTIAL_ENCRYPTION_KEY=
Error Codes

The system must support clear errors.

AUTH_REQUIRED

AUTH_INVALID

AUTH_EXPIRED

INTEGRATION_NOT_CONNECTED

RATE_LIMIT

AI_SERVICE_UNAVAILABLE

AI_INVALID_RESPONSE

DOCUMENT_PARSE_FAILURE

PROCESSING_FAILED

MISSING_FIELDS

NOT_FOUND

VALIDATION_ERROR

Never return a generic error when a meaningful error is possible.

Final Expected Outcome

The completed LifeOS application must allow a user to:

Create Account
      ↓
Login
      ↓
Connect Gmail
      ↓
Connect Calendar
      ↓
Upload Documents
      ↓
LifeOS Collects Information
      ↓
Background AI Processing
      ↓
AI Agents Understand Information
      ↓
Responsibilities Detected
      ↓
Deadlines Identified
      ↓
Requirements Extracted
      ↓
Relationships Connected
      ↓
Dependencies Detected
      ↓
Priorities Calculated
      ↓
Live Updates
      ↓
LIFEOS DASHBOARD
      ↓
"What should I do now?"
AI Coding Agent Implementation Instructions

This is the final section that was missing from the earlier LifeOS document but is present in the reference specification.

The AI coding agent must:

Build the application phase by phase.
Follow the folder structure strictly.
Keep controllers thin.
Put business logic inside services.
Never call MongoDB directly from controllers.
Keep AI agents pure and independent of HTTP.
Never call an integration directly from an AI agent.
Route integration calls through integrationService.
Wrap every integration using baseIntegration.js.
Treat every secret as process.env.
Encrypt OAuth tokens before storing them.
Never expose credentials to the frontend.
Use MongoDB when available.
Use an in-memory fallback when MongoDB is unavailable.
Use BullMQ + Redis when available.
Use an in-memory processing fallback when Redis is unavailable.
Emit a Socket.IO event for every agent step.
Write one ProcessingLog for every agent event.
Persist important notifications.
Use AI fallback in this order:
OpenRouter
   ↓
Gemini
   ↓
Rule-Based Engine
Validate every AI-generated structured response.
Never automatically merge low-confidence responsibilities without review.
Make every priority decision explainable.
Handle every integration failure explicitly.
Report all files created or changed at the end of every development phase.