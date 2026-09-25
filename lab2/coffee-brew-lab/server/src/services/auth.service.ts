import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { usersRepository, type SafeUser, type UserRole } from '../repositories/users.repository.js';
import { sessionsRepository, type UserSessionRecord } from '../repositories/sessions.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import type { FastifyInstance } from 'fastify';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: SafeUser;
}

export class AuthService {
  async register(
    data: { email: string; password: string; name: string; role: 'Taster' | 'Barista' },
    ipAddress?: string,
    userAgent?: string,
    fastify?: FastifyInstance
  ): Promise<TokenPair> {
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) {
      const err: any = new Error('A user with this email address already exists');
      err.statusCode = 409;
      err.name = 'Conflict';
      throw err;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const user = await usersRepository.create({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      role: data.role,
    });

    await auditRepository.log({
      eventType: 'AUTH_REGISTER',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress,
      details: { name: user.name, role: user.role },
    });

    return this.createSessionAndTokens(user, ipAddress, userAgent, fastify);
  }

  async login(
    data: { email: string; password: string },
    ipAddress?: string,
    userAgent?: string,
    fastify?: FastifyInstance
  ): Promise<TokenPair> {
    const user = await usersRepository.findByEmail(data.email);
    if (!user) {
      await auditRepository.log({
        eventType: 'AUTH_LOGIN_FAILED',
        userEmail: data.email,
        ipAddress,
        details: { reason: 'User not found' },
      });
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.name = 'Unauthorized';
      throw err;
    }

    const match = await bcrypt.compare(data.password, user.password_hash);
    if (!match) {
      await auditRepository.log({
        eventType: 'AUTH_LOGIN_FAILED',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        details: { reason: 'Incorrect password' },
      });
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.name = 'Unauthorized';
      throw err;
    }

    await auditRepository.log({
      eventType: 'AUTH_LOGIN_SUCCESS',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress,
      details: { userAgent },
    });

    return this.createSessionAndTokens(user, ipAddress, userAgent, fastify);
  }

  async refreshToken(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    fastify?: FastifyInstance
  ): Promise<TokenPair> {
    const [sessionId, tokenSecret] = rawRefreshToken.split('.');
    if (!sessionId || !tokenSecret) {
      const err: any = new Error('Invalid refresh token format');
      err.statusCode = 401;
      err.name = 'Unauthorized';
      throw err;
    }

    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) {
      const err: any = new Error('Session has expired or was revoked');
      err.statusCode = 401;
      err.name = 'Unauthorized';
      throw err;
    }

    const tokenHash = crypto.createHash('sha256').update(tokenSecret).digest('hex');
    if (tokenHash !== session.refresh_token_hash) {
      // Possible token theft: revoke session immediately!
      await sessionsRepository.revokeSession(sessionId);
      await auditRepository.log({
        eventType: 'SECURITY_TOKEN_TAMPERING',
        userId: session.user_id,
        ipAddress,
        details: { sessionId, reason: 'Token hash mismatch' },
      });
      const err: any = new Error('Invalid refresh token credentials');
      err.statusCode = 401;
      err.name = 'Unauthorized';
      throw err;
    }

    // Refresh token rotation: revoke old session and issue new one
    await sessionsRepository.revokeSession(sessionId);

    const user = await usersRepository.findById(session.user_id);
    if (!user) {
      const err: any = new Error('User no longer exists');
      err.statusCode = 401;
      err.name = 'Unauthorized';
      throw err;
    }

    await auditRepository.log({
      eventType: 'AUTH_REFRESH',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress,
      details: { oldSessionId: sessionId },
    });

    return this.createSessionAndTokens(user, ipAddress, userAgent, fastify);
  }

  async logout(sessionId?: string, userId?: number, ipAddress?: string): Promise<void> {
    if (sessionId) {
      await sessionsRepository.revokeSession(sessionId);
      await auditRepository.log({
        eventType: 'AUTH_LOGOUT',
        userId,
        ipAddress,
        details: { sessionId },
      });
    }
  }

  async getActiveSessions(userId: number, isAdmin = false) {
    if (isAdmin) {
      return sessionsRepository.findAllActiveSessions();
    }
    return sessionsRepository.findActiveSessionsByUserId(userId);
  }

  async revokeSession(sessionId: string, requestingUser: { id: number; role: UserRole }): Promise<void> {
    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) {
      const err: any = new Error('Session not found');
      err.statusCode = 404;
      err.name = 'NotFound';
      throw err;
    }

    if (requestingUser.role !== 'Admin' && session.user_id !== requestingUser.id) {
      const err: any = new Error('Forbidden: Cannot revoke other users sessions');
      err.statusCode = 403;
      err.name = 'Forbidden';
      throw err;
    }

    await sessionsRepository.revokeSession(sessionId);
    await auditRepository.log({
      eventType: 'SESSION_REVOKED',
      userId: requestingUser.id,
      details: { targetSessionId: sessionId, targetUserId: session.user_id },
    });
  }

  async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      // Return cleanly to avoid email enumeration
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sessionsRepository.createPasswordReset({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await auditRepository.log({
      eventType: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      userEmail: user.email,
      ipAddress,
    });

    await sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await sessionsRepository.findValidPasswordReset(tokenHash);

    if (!resetRecord) {
      const err: any = new Error('Password reset token is invalid or has expired');
      err.statusCode = 400;
      err.name = 'BadRequest';
      throw err;
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await usersRepository.updatePassword(resetRecord.user_id, newHash);
    await sessionsRepository.markPasswordResetUsed(resetRecord.id);
    // Revoke all existing sessions on password change for security
    await sessionsRepository.revokeAllUserSessions(resetRecord.user_id);

    const user = await usersRepository.findById(resetRecord.user_id);

    await auditRepository.log({
      eventType: 'PASSWORD_RESET_COMPLETED',
      userId: resetRecord.user_id,
      userEmail: user?.email,
      ipAddress,
    });
  }

  private async createSessionAndTokens(
    user: { id: number; email: string; name: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    fastify?: FastifyInstance
  ): Promise<TokenPair> {
    const sessionId = crypto.randomUUID();
    const tokenSecret = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenSecret).digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await sessionsRepository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: tokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    });

    const safeUser = usersRepository.toSafeUser(user as any);

    // Short-lived JWT Access Token: 15 minutes
    const accessToken = fastify
      ? fastify.jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            sessionId,
          },
          { expiresIn: '15m' }
        )
      : '';

    const refreshToken = `${sessionId}.${tokenSecret}`;

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: safeUser,
    };
  }
}

export const authService = new AuthService();
