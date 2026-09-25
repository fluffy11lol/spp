import { pool } from '../db/index.js';

export type UserRole = 'Taster' | 'Barista' | 'Admin';

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<UserRecord, 'password_hash'>;

export class UsersRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const res = await pool.query<UserRecord>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<UserRecord | null> {
    const res = await pool.query<UserRecord>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }

  async create(user: {
    email: string;
    password_hash: string;
    name: string;
    role: UserRole;
  }): Promise<UserRecord> {
    const res = await pool.query<UserRecord>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.email.toLowerCase().trim(), user.password_hash, user.name.trim(), user.role]
    );
    return res.rows[0];
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    );
  }

  toSafeUser(user: UserRecord): SafeUser {
    const { password_hash, ...safe } = user;
    return safe;
  }
}

export const usersRepository = new UsersRepository();
