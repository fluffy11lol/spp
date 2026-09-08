import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pastebin.db');
const db: DatabaseType = new Database(dbPath);

// SQLite Pragmas for performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'plaintext',
    syntax_highlighted_html TEXT NOT NULL,
    is_unlisted INTEGER DEFAULT 0,
    file_path TEXT,
    file_original_name TEXT,
    file_size INTEGER,
    file_mimetype TEXT,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
  CREATE INDEX IF NOT EXISTS idx_snippets_unlisted ON snippets(is_unlisted);
  CREATE INDEX IF NOT EXISTS idx_snippets_expires_at ON snippets(expires_at);
`);

export default db;
