import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  recipesService,
  ServiceError,
} from '../services/recipes.service.js';
import { parseMultipartRecipe } from '../utils/storage.js';

export class RecipesHandler {
  async listRecipes(req: FastifyRequest, reply: FastifyReply) {
    const { search, method } = req.query as {
      search?: string;
      method?: string;
    };

    const recipes = await recipesService.getAllRecipes({ search, method });
    return reply.status(200).send(recipes);
  }

  async getRecipe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid recipe ID format',
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    try {
      const recipe = await recipesService.getRecipeById(numId);
      return reply.status(200).send(recipe);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.status(err.statusCode).send({
          statusCode: err.statusCode,
          error: err.name,
          message: err.message,
          requestId: req.id,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
      throw err;
    }
  }

  async createRecipe(req: FastifyRequest, reply: FastifyReply) {
    let rawData: any = {};
    let uploadedImageUrl: string | undefined;

    if (req.isMultipart()) {
      try {
        const parsed = await parseMultipartRecipe(req);
        rawData = parsed.fields;
        uploadedImageUrl = parsed.imageUrl;
      } catch (err: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.message || 'Unable to process multipart upload',
          requestId: req.id,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    } else {
      rawData = req.body || {};
    }

    const currentUser = (req as any).user;

    try {
      const created = await recipesService.createRecipe(
        rawData,
        uploadedImageUrl,
        currentUser,
        req.ip
      );
      return reply.status(201).send(created);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.status(err.statusCode).send({
          statusCode: err.statusCode,
          error: err.name,
          message: err.message,
          details: err.fields,
          requestId: req.id,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
      throw err;
    }
  }

  async updateRecipe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid recipe ID format',
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    let rawData: any = {};
    let uploadedImageUrl: string | undefined;

    if (req.isMultipart()) {
      try {
        const parsed = await parseMultipartRecipe(req);
        rawData = parsed.fields;
        uploadedImageUrl = parsed.imageUrl;
      } catch (err: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.message || 'Unable to process multipart upload',
          requestId: req.id,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    } else {
      rawData = req.body || {};
    }

    const currentUser = (req as any).user;

    try {
      const updated = await recipesService.updateRecipe(
        numId,
        rawData,
        uploadedImageUrl,
        currentUser,
        req.ip
      );
      return reply.status(200).send(updated);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.status(err.statusCode).send({
          statusCode: err.statusCode,
          error: err.name,
          message: err.message,
          details: err.fields,
          requestId: req.id,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
      throw err;
    }
  }

  async deleteRecipe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid recipe ID format',
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    const currentUser = (req as any).user;

    try {
      const result = await recipesService.deleteRecipe(numId, currentUser, req.ip);
      return reply.status(200).send(result);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.status(err.statusCode).send({
          statusCode: err.statusCode,
          error: err.name,
          message: err.message,
          requestId: req.id,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
      throw err;
    }
  }
}

export const recipesHandler = new RecipesHandler();
