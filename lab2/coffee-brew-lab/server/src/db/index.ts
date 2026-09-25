import pg from 'pg';
import { seedInitialData } from './seed.js';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgrespassword'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'coffee_db'}`;

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

export async function initDatabase(): Promise<void> {
  const maxRetries = 15;
  const retryInterval = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          -- Users table with RBAC roles: Taster, Barista, Admin
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(150) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'Taster',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Recipes table
          CREATE TABLE IF NOT EXISTS recipes (
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            roaster VARCHAR(150) NOT NULL,
            origin VARCHAR(150) NOT NULL,
            method VARCHAR(50) NOT NULL,
            coffee_weight REAL NOT NULL,
            water_amount REAL NOT NULL,
            water_temperature INTEGER NOT NULL,
            grind_size VARCHAR(100) NOT NULL,
            brew_time_seconds INTEGER NOT NULL,
            rating INTEGER NOT NULL DEFAULT 5,
            acidity INTEGER NOT NULL DEFAULT 3,
            sweetness INTEGER NOT NULL DEFAULT 3,
            body INTEGER NOT NULL DEFAULT 3,
            tasting_notes TEXT[] NOT NULL DEFAULT '{}',
            image_url TEXT,
            processing_method VARCHAR(50) DEFAULT 'Washed',
            author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            author_name VARCHAR(150) DEFAULT 'Master Barista',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Add author columns if table already existed without them
          ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
          ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_name VARCHAR(150) DEFAULT 'Master Barista';

          -- Active user sessions (Refresh Token tracking & revocation)
          CREATE TABLE IF NOT EXISTS user_sessions (
            id VARCHAR(64) PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            refresh_token_hash VARCHAR(255) NOT NULL,
            user_agent TEXT,
            ip_address VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ
          );
          CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);

          -- Password reset requests
          CREATE TABLE IF NOT EXISTS password_resets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);

          -- Structured audit logs for security & business event auditing
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            user_email VARCHAR(255),
            user_role VARCHAR(50),
            ip_address VARCHAR(100),
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
          CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
        `);

        await seedInitialData(client);
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, retryInterval));
    }
  }
}
