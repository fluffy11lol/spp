# Pastebin SSR / Code & Config Snippet Vault

A minimalist, server-side rendered (SSR) web application for storing, sharing, and managing code snippets, configuration files, and logs.
Developed as part of **Laboratory Work #1**.

---

## Tech Stack

* **Language:** TypeScript 5.7
* **Runtime:** Node.js (ES Modules) via `tsx`
* **Web Framework:** Express.js
* **Template Engine (SSR):** EJS
* **Database:** SQLite (`better-sqlite3`) — single-file embedded database
* **File Uploads:** `multer` (`multipart/form-data`)
* **Server-Side Syntax Highlighting:** `highlight.js` (GitHub Dark theme)
* **Date & Expiration Utilities:** `dayjs`

---

## Lab Requirements Implementation

1. **Server-Side Rendering (SSR):**
   * All pages are generated directly on the server with EJS templates (`views/index.ejs`, `views/new.ejs`, `views/show.ejs`, `views/404.ejs`).
   * The client receives ready-to-render HTML with server-highlighted code.

2. **Form Submissions:**
   * Snippet creation via `<form method="POST" action="/snippets" enctype="multipart/form-data">`.
   * Search & Filters via `<form method="GET" action="/">` with query parameters (`?search=...&language=...&status=...`).
   * Snippet deletion via `<form method="POST" action="/snippets/:id/delete">`.

3. **Expiration & Deadlines (`expires_at`):**
   * Presets: 10 minutes, 1 hour, 1 day, 1 week, 1 month, never, or custom date/time.
   * Visual status badges (`Active`, `Expired`, `Never Expires`).
   * Automated background cleanup every 30 minutes to purge expired records.

4. **File Attachments:**
   * Support for attaching code files, configs, logs, or archives (up to 10MB).
   * Auto-import: If the code textarea is left empty, the server automatically reads the attached text file.
   * Direct file download via `/snippets/:id/download`.

5. **Additional Features:**
   * Server-side syntax highlighting for 15+ languages (Go, JS, TS, Python, YAML, JSON, SQL, Rust, C++, Dockerfile, etc.).
   * Unlisted mode (private snippets accessible only via direct link).
   * Raw text viewer (`/snippets/:id/raw`).
   * View counter and copy-to-clipboard actions.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (with hot reload)
```bash
npm run dev
```

### 3. Build & Typecheck
```bash
npm run build
```

The application will be available at: **http://localhost:3000**

---

## Project Structure

```
.
├── data/
│   └── pastebin.db              # SQLite Database
├── uploads/                     # Uploaded file attachments
├── public/
│   ├── css/
│   │   ├── style.css            # Dark theme styles
│   │   └── highlight.css        # Highlight.js GitHub Dark theme
├── src/
│   ├── db/
│   │   ├── database.ts          # SQLite connection and schema init
│   │   └── snippetRepository.ts # Database CRUD queries
│   ├── middleware/
│   │   └── upload.ts            # Multer file upload configuration
│   ├── services/
│   │   └── snippetService.ts    # Syntax highlighting & business logic
│   ├── routes/
│   │   └── snippetRoutes.ts     # Express route handlers
│   ├── types/
│   │   └── snippet.ts           # TypeScript interfaces & DTOs
│   └── app.ts                   # Application entrypoint
├── views/
│   ├── partials/
│   │   ├── header.ejs           # Header & navigation with SVG icons
│   │   └── footer.ejs           # Footer
│   ├── index.ejs                # Public snippet list & filters
│   ├── new.ejs                  # Snippet creation form
│   ├── show.ejs                 # Snippet viewer & download actions
│   ├── 404.ejs                  # 404 Not Found page
│   └── error.ejs                # 500 Server Error page
├── tsconfig.json
├── package.json
└── README.md
```
