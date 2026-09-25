import { pool } from '../db/index.js';

export interface UserSessionRecord {
  id: string;
  user_id: number;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface PasswordResetRecord {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export class SessionsRepository {
  async createSession(session: {
    id: string;
    userId: number;
    refreshTokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<UserSessionRecord> {
    const res = await pool.query<UserSessionRecord>(
      `INSERT INTO user_sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        session.id,
        session.userId,
        session.refreshTokenHash,
        session.userAgent || null,
        session.ipAddress || null,
        session.expiresAt.toISOString(),
      ]
    );
    return res.rows[0];
  }

  async findSessionById(sessionId: string): Promise<UserSessionRecord | null> {
    const res = await pool.query<UserSessionRecord>(
      'SELECT * FROM user_sessions WHERE id = $1 LIMIT 1',
      [sessionId]
    );
    return res.rows[0] || null;
  }

  async findActiveSessionsByUserId(userId: number): Promise<UserSessionRecord[]> {
    const res = await pool.query<UserSessionRecord>(
      `SELECT * FROM user_sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async findAllActiveSessions(): Promise<(UserSessionRecord & { user_email: string; user_role: string })[]> {
    const res = await pool.query<UserSessionRecord & { user_email: string; user_role: string }>(
      `SELECT s.*, u.email as user_email, u.role as user_role
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.revoked_at IS NULL AND s.expires_at > NOW()
       ORDER BY s.created_at DESC`
    );
    return res.rows;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE user_sessions
       SET revoked_at = NOW()
       WHERE id = $1 AND revoked_at IS NULL`,
      [sessionId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    await pool.query(
      `UPDATE user_sessions
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }

  async createPasswordReset(data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetRecord> {
    const res = await pool.query<PasswordResetRecord>(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.userId, data.tokenHash, data.expiresAt.toISOString()]
    );
    return res.rows[0];
  }

  async findValidPasswordReset(tokenHash: string): Promise<PasswordResetRecord | null> {
    const res = await pool.query<PasswordResetRecord>(
      `SELECT * FROM password_resets
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  async markPasswordResetUsed(id: number): Promise<void> {
    await pool.query(
      `UPDATE password_resets
       SET used_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }
}

export const sessionsRepository = new SessionsRepository();
