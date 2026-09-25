import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { initDatabase, pool } from './db/index.js';
import { initMinio, minioClient, BUCKET_NAME } from './utils/minio.js';
import { recipesRoutes } from './routes/recipes.routes.js';

const fastify = Fastify({
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

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Specialty Coffee Brew Lab API',
      description:
        'REST API documentation for coffee extraction recipes, sensory profiling, and MinIO S3 media storage.',
      version: '1.0.0',
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
      { name: 'Recipes', description: 'Coffee recipe CRUD operations' },
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

fastify.get('/docs', async (_, reply) => {
  return reply.redirect('/documentation');
});

fastify.get('/swagger', async (_, reply) => {
  return reply.redirect('/documentation');
});

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
      return reply.code(404).send({ error: 'File not found' });
    }
  }
);

await fastify.register(recipesRoutes, { prefix: '/api' });

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
  async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
);

const start = async () => {
  try {
    await initMinio();
    fastify.log.info('MinIO S3 storage initialized successfully');

    await initDatabase();
    fastify.log.info('Database initialized successfully');

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

start();
