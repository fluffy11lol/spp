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
    return reply.code(200).send(recipes);
  }

  async getRecipe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return reply.code(400).send({ error: 'Invalid recipe ID format' });
    }

    try {
      const recipe = await recipesService.getRecipeById(numId);
      return reply.code(200).send(recipe);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.code(err.statusCode).send({ error: err.message });
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
        return reply.code(400).send({
          error: 'File upload error',
          message: err.message || 'Unable to process file',
        });
      }
    } else {
      rawData = req.body || {};
    }

    try {
      const created = await recipesService.createRecipe(rawData, uploadedImageUrl);
      return reply.code(201).send(created);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.code(err.statusCode).send({
          error: 'Validation error',
          message: err.message,
          fields: err.fields,
        });
      }
      throw err;
    }
  }

  async updateRecipe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return reply.code(400).send({ error: 'Invalid recipe ID format' });
    }

    let rawData: any = {};
    let uploadedImageUrl: string | undefined;

    if (req.isMultipart()) {
      try {
        const parsed = await parseMultipartRecipe(req);
        rawData = parsed.fields;
        uploadedImageUrl = parsed.imageUrl;
      } catch (err: any) {
        return reply.code(400).send({
          error: 'File upload error',
          message: err.message || 'Unable to process file',
        });
      }
    } else {
      rawData = req.body || {};
    }

    try {
      const updated = await recipesService.updateRecipe(numId, rawData, uploadedImageUrl);
      return reply.code(200).send(updated);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.code(err.statusCode).send({
          error: err.statusCode === 400 ? 'Validation error' : err.message,
          message: err.message,
          fields: err.fields,
        });
      }
      throw err;
    }
  }

  async deleteRecipe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return reply.code(400).send({ error: 'Invalid recipe ID format' });
    }

    try {
      const result = await recipesService.deleteRecipe(numId);
      return reply.code(200).send(result);
    } catch (err: any) {
      if (err instanceof ServiceError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  }
}

export const recipesHandler = new RecipesHandler();
