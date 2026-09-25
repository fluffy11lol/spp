# BrewLog — Specialty Coffee Extraction Lab (Lab 2 & Lab 3)

A full-stack, production-grade Specialty Coffee Extraction Platform featuring layered architecture, MinIO S3 media storage, Role-Based Access Control (RBAC), temporal JWT authentication with session revocation, brute-force shields, structured audit logging, local SMTP email simulation, and automated CI quality pipelines.

---

## ☕ System Overview & Architecture

BrewLog coordinates 5 core services orchestrated via **Docker Compose** and accessible behind a high-performance **Nginx Reverse Proxy**:

```
                              [ Web Browser / HTTP Client ]
                                            │
                                            ▼
                          [ Nginx Reverse Proxy (Port 3000 / 80) ]
                            │                    │             │
              ┌─────────────┘                    │             └─────────────┐
              │ /                                │ /api/, /docs, /uploads    │ (Direct)
              ▼                                  ▼                           ▼
  [ client: React 18 SPA ]             [ api: Fastify 4 Backend ]    [ Mailpit Web UI ]
  • TypeScript + Vite                  • TypeScript + Zod            • Port 8025
  • Tailwind CSS Dark Theme            • JWT (15m) + Refresh (7d)    • Local SMTP Inbox
  • Sensory Profiling UI               • Rate Limiter & Pino Logs    
  • Real-time Brew Timer               • Swagger OpenAPI UI          
                                                 │
                     ┌───────────────────────────┼───────────────────────────┐
                     ▼                           ▼                           ▼
          [ db: PostgreSQL 16 ]       [ minio: S3 Storage ]       [ mailpit: SMTP 1025 ]
          • users & recipes           • Coffee bag photos         • Password reset emails
          • user_sessions (tokens)    • SVG/PNG/JPEG streaming    • Zero external spam
          • audit_logs & resets       • Console: Port 9001
```

---

## 🛠 Tech Stack

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Responsive SPA with RBAC persona switcher, active sessions dashboard, and brew stopwatch |
| **Backend** | Fastify 4.28, TypeScript, Zod | 4-layer architecture, RFC 7807 problem details, rate limiting, and JWT signing |
| **Database** | PostgreSQL 16 Alpine | ACID relational storage: `recipes`, `users`, `user_sessions`, `password_resets`, `audit_logs` |
| **Object Storage** | MinIO (S3-compatible) | S3 media bucket storage with streaming proxy at `/uploads/:filename` |
| **Email Service** | Mailpit (`axllent/mailpit`) | Embedded SMTP server on port 1025 with webmail UI on port 8025 for password recovery |
| **Reverse Proxy** | Nginx Alpine | Serves frontend build, proxies `/api/`, sets `X-Real-IP` and `X-Request-ID` headers |
| **Security** | `@fastify/jwt`, `bcryptjs`, `@fastify/rate-limit` | Password salting, temporal keys, session revocation, and brute-force mitigation |
| **CI / Quality** | GitHub Actions & `./scripts/verify.sh` | Automated linting, type-checking, schema tests, and production build verification |

---

## 🔐 Role-Based Access Control (RBAC) & Authentication

BrewLog implements a multi-tier authorization hierarchy governed by **temporal keys**:
- **Access Token:** Short-lived JWT (15 minutes) carrying user ID, role, email, and current `sessionId`.
- **Refresh Token:** Cryptographic 7-day token (`<sessionId>.<secret>`). The secret is hashed with SHA-256 and verified against `user_sessions` in PostgreSQL. Supports automatic token rotation and instant revocation.

### Permission Matrix

| Role | Browse & Filter | Interactive Brew Timer | Sensory Profiling | Create Recipe & S3 Upload | Edit & Delete Own Recipes | Edit & Delete Any Recipe | Active Sessions Dashboard | Audit Logs Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Taster** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Own) | ❌ |
| **Barista** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (Own) | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (All Users) | ✅ |

### Pre-Seeded Demo Personas (1-Click Switcher in UI)

For seamless evaluation and defense demonstration, the system pre-seeds 3 active accounts (with salted passwords):

| Persona / Name | Email | Password | Role & Privileges |
| :--- | :--- | :--- | :--- |
| **Head Roaster Admin** | `admin@brewlog.local` | `Password123!` | **Admin:** Full system control, global audit logs, revoke any session |
| **James Hoffmann** | `barista@brewlog.local` | `Password123!` | **Barista:** Full recipe authoring, S3 uploads, manage own recipes |
| **Q-Grader Taster** | `taster@brewlog.local` | `Password123!` | **Taster:** Read-only sensory lab access & extraction timer |

---

## 🚦 Semantic HTTP Error Handling (RFC 7807 / RFC 9110)

The backend provides uniform JSON error payloads adhering to the **Problem Details for HTTP APIs** standard:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Content",
  "message": "Validation failed for registration input",
  "details": {
    "password": ["Password must be at least 6 characters"]
  },
  "requestId": "e309cb9f-26ec-4c66-b3a6-b51e0413e16c",
  "timestamp": "2026-09-25T14:00:00.000Z",
  "path": "/api/auth/register"
}
```

### Complete HTTP Status Code Mapping

- **`200 OK`**: Successful retrieval, recipe update, or session listing.
- **`201 Created`**: Successful recipe creation or new user registration.
- **`204 No Content`**: Successful logout or active session revocation.
- **`400 Bad Request`**: Malformed payload, invalid query parameter format, or bad password reset payload.
- **`401 Unauthorized`**: Missing, expired, or invalid JWT Bearer token or invalid login credentials.
- **`403 Forbidden`**: Role lacks permission (e.g., Taster trying to create recipes, or Barista trying to edit another user's recipe).
- **`404 Not Found`**: Recipe, media file, or session does not exist in the database.
- **`409 Conflict`**: Attempting to register an email address that is already registered.
- **`422 Unprocessable Content`**: Zod schema validation errors (e.g. coffee weight out of bounds, password too short).
- **`429 Too Many Requests`**: Rate limiter triggered (brute-force defense). Includes retry countdown seconds.
- **`500 Internal Server Error`**: Unexpected server-side failure.

---

## 🛡️ Brute-Force Shield, Sessions & Password Recovery

### 1. Brute-Force Defense (`@fastify/rate-limit`)
- Auth endpoints (`/api/auth/login`, `/api/auth/register`) are restricted to **10 requests per minute** per client IP.
- Password recovery (`/api/auth/forgot-password`) is restricted to **5 requests per minute** per client IP.
- Exceeding the threshold triggers immediate `429 Too Many Requests` with a descriptive retry cooldown.

### 2. Active Sessions Dashboard
- Navigate to **Sessions** in the top navigation bar to inspect all active devices/connections.
- Displays IP address, User-Agent browser/device info, session creation timestamp, and a green **Current Device** badge.
- Clicking **Revoke** immediately removes the session from PostgreSQL and invalidates the corresponding refresh token.

### 3. Password Reset via Local Mailpit SMTP
1. Click **Sign In** -> **Forgot password?** and submit your email.
2. The Fastify backend generates a secure crypto token (valid for 1 hour) and dispatches an HTML email through Mailpit on port 1025.
3. Open the **Mailpit Web UI** at [http://localhost:8025](http://localhost:8025) to view incoming emails in real-time.
4. Click the reset button in the email to open the reset form at `http://localhost:3000/?reset_token=...` and set a new password.
5. All old sessions are automatically revoked upon successful password change for account security.

---

## 📊 Structured JSON Logging & Security Audit Trail

- Fastify is configured with **Pino structured JSON logging**, stamping each log line with a unique correlation ID (`x-request-id`).
- All security-sensitive actions are written to the `audit_logs` table in PostgreSQL:
  - `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`
  - `AUTH_REGISTER`, `AUTH_LOGOUT`, `AUTH_REFRESH`
  - `SESSION_REVOKED`
  - `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`
  - `RECIPE_CREATED`, `RECIPE_UPDATED`, `RECIPE_DELETED`
  - `ACCESS_DENIED_RECIPE_UPDATE`, `ACCESS_DENIED_RECIPE_DELETE`
- **Admin Audit Modal:** Admins can click **Audit** in the navigation bar to inspect, search, and filter the live security audit log.

---

## 🚀 Quick Start (Docker Compose)

The easiest way to start all 5 services is with Docker Compose:

```bash
docker compose up --build -d
```

### Service Map & Access URLs

| Service | Port / URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Web Application (SPA)** | [http://localhost:3000](http://localhost:3000) (or port 80) | Nginx Reverse Proxy & Client SPA |
| **REST API Server** | [http://localhost:4000](http://localhost:4000) | Fastify Direct Backend |
| **Interactive Swagger Docs** | [http://localhost:3000/documentation](http://localhost:3000/documentation) | OpenAPI 3.0 UI |
| **Mailpit Web UI** | [http://localhost:8025](http://localhost:8025) | Local SMTP mailbox for password resets |
| **MinIO S3 Console** | [http://localhost:9001](http://localhost:9001) | User: `minioadmin` / Pass: `minioadminpassword` |
| **PostgreSQL 16** | `localhost:5432` | User: `postgres`, DB: `coffee_db`, Pass: `postgrespassword` |

To stop the containers:
```bash
docker compose down
```

---

## 📡 REST API Reference

Full interactive documentation is served at [http://localhost:3000/documentation](http://localhost:3000/documentation) (or `/docs`).

### Authentication & Sessions (`/api/auth`)
| Method | Endpoint | Access | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new account (`Taster` or `Barista`) | `201`, `409`, `422`, `429` |
| `POST` | `/api/auth/login` | Public | Sign in with email and password | `200`, `401`, `422`, `429` |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh token and issue new 15m access token | `200`, `400`, `401` |
| `POST` | `/api/auth/logout` | Authenticated | Revoke current user session and logout | `204`, `401` |
| `GET` | `/api/auth/me` | Authenticated | Return authenticated profile & role info | `200`, `401` |
| `GET` | `/api/auth/sessions` | Authenticated | List active sessions (Admins see all users) | `200`, `401` |
| `DELETE` | `/api/auth/sessions/:id` | Authenticated | Revoke a specific active session | `204`, `401`, `403`, `404` |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset email via Mailpit | `200`, `422`, `429` |
| `POST` | `/api/auth/reset-password` | Public | Set new password using token | `200`, `400`, `422` |

### Administration (`/api/admin`)
| Method | Endpoint | Access | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/audit-logs` | `Admin` Only | Stream recent security and business audit logs | `200`, `401`, `403` |

### Recipes & Media (`/api/recipes`, `/uploads`)
| Method | Endpoint | Access | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/recipes` | Public | List recipes with optional `?search=` and `?method=` filters | `200` |
| `GET` | `/api/recipes/:id` | Public | Retrieve detailed recipe by ID | `200`, `400`, `404` |
| `POST` | `/api/recipes` | `Barista`, `Admin` | Create new recipe (JSON or multipart with photo upload) | `201`, `401`, `403`, `422` |
| `PUT` | `/api/recipes/:id` | `Barista` (own), `Admin` | Update recipe parameters and replace photo in S3 | `200`, `401`, `403`, `404`, `422` |
| `DELETE` | `/api/recipes/:id` | `Barista` (own), `Admin` | Delete recipe and purge photo from MinIO | `200`, `401`, `403`, `404` |
| `GET` | `/uploads/:filename` | Public | Stream uploaded image from MinIO S3 bucket | `200`, `404` |
| `GET` | `/api/health` | Public | Health check status | `200` |

---

## 🧪 Automated Testing & CI Pipeline

### 1. Automated Verification Script (Local)
Run all quality gates (backend typecheck, 20 passing unit tests, frontend typecheck, and Vite production build) in a single command:

```bash
./scripts/verify.sh
```

### 2. Manual Test Execution
```bash
# In server directory:
cd server
npm run verify        # Runs TypeScript check & all schema/crypto unit tests
npm run test:unit     # Runs unit tests (20 passing tests)

# In client directory:
cd client
npm run build         # Runs TypeScript check & Vite production bundle
```

### 3. GitHub Actions Workflow
The CI pipeline is configured at `.github/workflows/ci.yml`. On every `push` and `pull_request` to `main`, GitHub Actions automatically:
1. Sets up Node.js 20.x with npm caching.
2. Performs backend dependency verification and runs `npx tsc --noEmit` + `npm run test:unit`.
3. Performs frontend dependency verification and runs `npx tsc --noEmit` + `npm run build`.

---

## 📂 Project Structure

```
coffee-brew-lab/
├── .github/workflows/ci.yml       # GitHub Actions automated CI pipeline
├── docker-compose.yml             # Orchestration for db, minio, mailpit, api, client
├── scripts/
│   └── verify.sh                  # One-command quality check (typecheck, tests, build)
├── client/                        # React 18 + Vite frontend
│   ├── nginx.conf                 # Reverse proxy configuration
│   ├── src/
│   │   ├── api/client.ts          # API client with token auto-refresh & problem details
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # RBAC context & persona switcher
│   │   │   └── RecipeContext.tsx  # Global recipe state & filters
│   │   ├── components/
│   │   │   ├── AuthModal.tsx      # Sign in, register, and quick role switcher
│   │   │   ├── SessionsModal.tsx  # Active sessions & token revocation
│   │   │   ├── AuditLogsModal.tsx # Admin security event stream viewer
│   │   │   ├── ResetPasswordModal.tsx # Token password reset dialog
│   │   │   ├── BrewTimerModal.tsx # 3-stage interactive extraction stopwatch
│   │   │   ├── RecipeCard.tsx     # Role-aware recipe card
│   │   │   └── SensoryControl.tsx # 5-step discrete rating control
│   │   └── types/recipe.ts        # TypeScript interfaces & RFC 7807 error types
└── server/                        # Fastify 4 backend
    └── src/
        ├── db/                    # PostgreSQL pool, table migrations, and seed data
        ├── repositories/          # Data access: users, sessions, audit, recipes
        ├── services/              # Business logic: auth, cryptographic tokens, recipes
        ├── handlers/              # Controllers with semantic HTTP status codes
        ├── routes/                # Route plugins with preHandler RBAC guards
        ├── schemas/               # Zod validation schemas & unit tests
        └── utils/                 # MinIO client, Mailpit nodemailer, and multipart parser
```
