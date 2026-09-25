import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import crypto from 'crypto';

import { initDatabase, pool } from './db/index.js';
import { initMinio, minioClient, BUCKET_NAME } from './utils/minio.js';
import { recipesRoutes } from './routes/recipes.routes.js';
import { authRoutes } from './routes/auth.routes.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export function buildServer() {
  const server = Fastify({
    requestIdHeader: 'x-request-id',
    genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
    logger: {
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  return server;
}

const fastify = buildServer();

// Global CORS
await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Cookie parsing
await fastify.register(cookie);

// Global Rate Limiter & Brute-Force Shield
await fastify.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute',
  errorResponseBuilder: (req, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit threshold exceeded. Please retry in ${Math.ceil(context.ttl / 1000)} seconds.`,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    path: req.url,
  }),
});

// Multipart support
await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// JWT Authentication Setup
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecretbrewlogjwtkey1234567890specialtycoffee',
});

// Fastify Authentication Decorators
fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err: any) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication token is missing, expired, or invalid',
      requestId: request.id,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
});

fastify.decorate('requireRole', (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Insufficient permissions. Access requires one of: [${allowedRoles.join(', ')}]`,
        requestId: request.id,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  };
});

// Centralized Semantic Error Handling (RFC 7807 / RFC 9110)
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;

  request.log.error(
    {
      err: error,
      reqId: request.id,
      method: request.method,
      url: request.url,
      statusCode,
    },
    'Server request error'
  );

  reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    details: (error as any).details || (error as any).validation || undefined,
    requestId: request.id,
    timestamp: new Date().toISOString(),
    path: request.url,
  });
});

// Swagger OpenAPI documentation
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Specialty Coffee Brew Lab API',
      description:
        'Production REST API with RBAC authentication (JWT/Refresh), rate limiting, audit logging, and MinIO S3 media storage.',
      version: '2.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Direct API Server (Backend)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Client Reverse Proxy (Nginx)',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication, registration, sessions, and password recovery' },
      { name: 'Recipes', description: 'Coffee recipe CRUD operations with role validation' },
      { name: 'Admin', description: 'Administrative operations and audit logs' },
      { name: 'System', description: 'Health check and monitoring' },
    ],
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  staticCSP: true,
});

fastify.get('/docs', async (_, reply) => reply.redirect('/documentation'));
fastify.get('/swagger', async (_, reply) => reply.redirect('/documentation'));

// MinIO S3 Image streamer
fastify.get(
  '/uploads/:filename',
  {
    schema: {
      tags: ['System'],
      summary: 'Stream uploaded coffee photo from MinIO S3 storage',
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Uploaded image file name' },
        },
      },
    },
  },
  async (req, reply) => {
    const { filename } = req.params as { filename: string };
    try {
      const stat = await minioClient.statObject(BUCKET_NAME, filename);
      const contentType =
        stat.metaData['content-type'] ||
        (filename.endsWith('.svg')
          ? 'image/svg+xml'
          : filename.endsWith('.png')
          ? 'image/png'
          : filename.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg');

      const stream = await minioClient.getObject(BUCKET_NAME, filename);
      reply.header('Content-Type', contentType);
      reply.header('Cache-Control', 'public, max-age=86400');
      return reply.send(stream);
    } catch {
      return reply.status(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'The requested media file was not found in S3 storage',
        requestId: req.id,
      });
    }
  }
);

// Register feature routes
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(recipesRoutes, { prefix: '/api' });

// Health check endpoint
fastify.get(
  '/api/health',
  {
    schema: {
      tags: ['System'],
      summary: 'Service health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  async () => ({ status: 'ok', timestamp: new Date().toISOString() })
);

const start = async () => {
  try {
    await initMinio();
    fastify.log.info('MinIO S3 storage initialized successfully');

    await initDatabase();
    fastify.log.info('PostgreSQL database & tables initialized successfully');

    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const stop = async () => {
  await fastify.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

if (process.env.NODE_ENV !== 'test') {
  start();
}
