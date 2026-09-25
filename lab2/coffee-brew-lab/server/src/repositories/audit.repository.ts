import { pool } from '../db/index.js';

export interface AuditLogRecord {
  id: number;
  event_type: string;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  ip_address: string | null;
  details: Record<string, any>;
  created_at: string;
}

export class AuditRepository {
  async log(entry: {
    eventType: string;
    userId?: number | null;
    userEmail?: string | null;
    userRole?: string | null;
    ipAddress?: string | null;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs (event_type, user_id, user_email, user_role, ip_address, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.eventType,
          entry.userId ?? null,
          entry.userEmail ?? null,
          entry.userRole ?? null,
          entry.ipAddress ?? null,
          JSON.stringify(entry.details || {}),
        ]
      );
    } catch {
      // Avoid failing main operations if audit logging encounters a glitch
    }
  }

  async getRecentLogs(limit = 100): Promise<AuditLogRecord[]> {
    const res = await pool.query<AuditLogRecord>(
      `SELECT * FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

export const auditRepository = new AuditRepository();
