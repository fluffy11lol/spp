# BrewLog — Specialty Coffee Extraction Lab

A modern, full-stack Single Page Application (SPA) and REST API for tracking specialty coffee brewing recipes, bean origins, extraction parameters, and sensory profiles.

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite | Responsive SPA, Tailwind CSS, Lucide icons |
| **Backend** | Node.js + Fastify + TypeScript | High-performance REST API with Zod validation |
| **Database** | PostgreSQL 16 | Relational storage for recipe data & profiles |
| **Object Storage** | MinIO (S3-compatible) | S3 storage for coffee bag and bean photos |
| **Reverse Proxy** | Nginx | Serves static assets, routes `/api/` and `/uploads/` |
| **Containerization** | Docker & Docker Compose | Multi-container setup (`db`, `minio`, `api`, `client`) |

## Features

- **Full CRUD Cycle:** Create, Read, Update, and Delete coffee recipes without page reload.
- **Multipart Uploads:** Upload coffee package/bean photos via `multipart/form-data`, stored directly in MinIO S3.
- **Interactive Barista Brew Timer:** Real-time extraction stopwatch with step-by-step brewing guidance (Blooming, First Pour, Final Pour & Drawdown).
- **Smart Ratio Calculator:** Automatically calculates water/coffee ratios (1:15, 1:16, 1:16.6).
- **Strict Data Validation:** Backend validation via Zod with structured `400 Bad Request` field error feedback and UI toast notifications.
- **Sensory Profiling:** 1–5 scale sliders for Acidity, Sweetness, and Body, along with customizable flavor descriptor tags.

---

## Backend Layered Architecture

The backend strictly separates concerns into 4 decoupled layers:

```
server/src/
├── routes/          # Fastify routing plugins (URL-to-Handler binding)
│   └── recipes.routes.ts
├── handlers/        # HTTP transport controllers (Request/Response & status codes)
│   └── recipes.handler.ts
├── services/        # Business logic & domain validation (Zod, MinIO S3 coordination)
│   └── recipes.service.ts
├── repositories/    # Data access layer (PostgreSQL SQL queries & pool interaction)
│   └── recipes.repository.ts
├── schemas/         # Data validation schemas & DTO types
│   └── recipe.schema.ts
├── db/              # Database connection & seed runner
└── utils/           # MinIO S3 client & multipart parser
```

---

## Quick Start (Docker Compose)

The easiest way to run the entire application is with Docker Compose:

```bash
docker compose up --build -d
```

### Service URLs & Ports

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Web Application (SPA)** | [http://localhost](http://localhost) or [http://localhost:3000](http://localhost:3000) | Main user interface |
| **REST API Server** | [http://localhost:4000](http://localhost:4000) | Fastify backend |
| **API Health Check** | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Returns JSON status |
| **MinIO Web Console** | [http://localhost:9001](http://localhost:9001) | User: `minioadmin` / Pass: `minioadminpassword` |
| **PostgreSQL** | `localhost:5432` | User: `postgres`, DB: `coffee_db`, Pass: `postgrespassword` |

To stop the services:
```bash
docker compose down
```

---

## REST API Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recipes` | List recipes (supports `?search=` and `?method=`) | `200 OK` |
| `GET` | `/api/recipes/:id` | Get recipe by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/recipes` | Create recipe (`application/json` or `multipart/form-data`) | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/recipes/:id` | Update recipe and/or replace photo | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/recipes/:id` | Delete recipe and remove associated image | `200 OK`, `404 Not Found` |
| `GET` | `/uploads/:filename` | Stream uploaded photo from MinIO S3 | `200 OK`, `404 Not Found` |
| `GET` | `/api/health` | Service health status | `200 OK` |

---

## Automated Backend Tests

The project includes unit tests for Zod schema validation and integration tests for all REST endpoints:

```bash
cd server
npm test
```
To run only schema validation tests:
```bash
cd server
npm run test:unit
```

---

## Local Development (Without Docker)

If you prefer to run services individually on the host machine:

### 1. Start Database & MinIO
Ensure PostgreSQL and MinIO are running, or run only DB & MinIO in Docker:
```bash
docker compose up db minio -d
```

### 2. Start Backend Server
```bash
cd server
npm install
npm run dev
```
Server starts on `http://localhost:4000`.

### 3. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Client dev server starts on `http://localhost:5173` with proxy to `http://localhost:4000`.
