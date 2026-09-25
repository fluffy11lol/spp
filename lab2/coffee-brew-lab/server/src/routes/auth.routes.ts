import type { FastifyPluginAsync } from 'fastify';
import { authHandler } from '../handlers/auth.handler.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Public routes with rate limit protection
  fastify.post(
    '/auth/register',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    authHandler.register.bind(authHandler)
  );

  fastify.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    authHandler.login.bind(authHandler)
  );

  fastify.post('/auth/refresh', authHandler.refresh.bind(authHandler));

  fastify.post(
    '/auth/forgot-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    authHandler.forgotPassword.bind(authHandler)
  );

  fastify.post(
    '/auth/reset-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    authHandler.resetPassword.bind(authHandler)
  );

  // Authenticated routes
  fastify.register(async (authGroup) => {
    authGroup.addHook('preHandler', fastify.authenticate);

    authGroup.post('/auth/logout', authHandler.logout.bind(authHandler));
    authGroup.get('/auth/me', authHandler.me.bind(authHandler));
    authGroup.get('/auth/sessions', authHandler.getSessions.bind(authHandler));
    authGroup.delete('/auth/sessions/:id', authHandler.revokeSession.bind(authHandler));

    // Admin-only route
    authGroup.get(
      '/admin/audit-logs',
      { preHandler: [fastify.requireRole(['Admin'])] },
      authHandler.getAuditLogs.bind(authHandler)
    );
  });
};
