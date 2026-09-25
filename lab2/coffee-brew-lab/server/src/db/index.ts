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
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
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
