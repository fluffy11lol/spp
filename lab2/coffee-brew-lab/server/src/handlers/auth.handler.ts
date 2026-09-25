import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';
import { authService } from '../services/auth.service.js';
import { auditRepository } from '../repositories/audit.repository.js';

export class AuthHandler {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Content',
        message: 'Validation failed for registration input',
        details: parsed.error.flatten().fieldErrors,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.register(parsed.data, ipAddress, userAgent, req.server);

    return reply.status(201).send({
      statusCode: 201,
      message: 'Account registered successfully',
      data: result,
    });
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Content',
        message: 'Validation failed for login credentials',
        details: parsed.error.flatten().fieldErrors,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(parsed.data, ipAddress, userAgent, req.server);

    return reply.status(200).send({
      statusCode: 200,
      message: 'Logged in successfully',
      data: result,
    });
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Refresh token is required',
        details: parsed.error.flatten().fieldErrors,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.refreshToken(
      parsed.data.refreshToken,
      ipAddress,
      userAgent,
      req.server
    );

    return reply.status(200).send({
      statusCode: 200,
      message: 'Token rotated and refreshed successfully',
      data: result,
    });
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const sessionId = user?.sessionId;
    const userId = user?.id;

    await authService.logout(sessionId, userId, req.ip);

    return reply.status(204).send();
  }

  async me(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    return reply.status(200).send({
      statusCode: 200,
      data: user,
    });
  }

  async getSessions(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const sessions = await authService.getActiveSessions(user.id, user.role === 'Admin');

    return reply.status(200).send({
      statusCode: 200,
      data: sessions,
      currentSessionId: user.sessionId,
    });
  }

  async revokeSession(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    await authService.revokeSession(id, user);

    return reply.status(204).send();
  }

  async forgotPassword(req: FastifyRequest, reply: FastifyReply) {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Content',
        message: 'Invalid email address provided',
        details: parsed.error.flatten().fieldErrors,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    await authService.forgotPassword(parsed.data.email, req.ip);

    return reply.status(200).send({
      statusCode: 200,
      message: 'If the email exists in our records, a password reset link has been dispatched.',
    });
  }

  async resetPassword(req: FastifyRequest, reply: FastifyReply) {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Content',
        message: 'Invalid password reset input',
        details: parsed.error.flatten().fieldErrors,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    await authService.resetPassword(parsed.data.token, parsed.data.newPassword, req.ip);

    return reply.status(200).send({
      statusCode: 200,
      message: 'Password has been updated successfully. Please log in with your new credentials.',
    });
  }

  async getAuditLogs(req: FastifyRequest, reply: FastifyReply) {
    const logs = await auditRepository.getRecentLogs(100);
    return reply.status(200).send({
      statusCode: 200,
      data: logs,
    });
  }
}

export const authHandler = new AuthHandler();
