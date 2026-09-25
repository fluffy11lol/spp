import type { FastifyPluginAsync } from 'fastify';
import { recipesHandler } from '../handlers/recipes.handler.js';
import {
  listRecipesRouteSchema,
  getRecipeRouteSchema,
  createRecipeRouteSchema,
  updateRecipeRouteSchema,
  deleteRecipeRouteSchema,
} from '../schemas/recipe.openapi.js';

export const recipesRoutes: FastifyPluginAsync = async (fastify) => {
  // Public routes
  fastify.get(
    '/recipes',
    { schema: listRecipesRouteSchema },
    recipesHandler.listRecipes.bind(recipesHandler)
  );

  fastify.get(
    '/recipes/:id',
    { schema: getRecipeRouteSchema },
    recipesHandler.getRecipe.bind(recipesHandler)
  );

  // Protected mutation routes
  fastify.post(
    '/recipes',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['Barista', 'Admin'])],
      schema: createRecipeRouteSchema,
    },
    recipesHandler.createRecipe.bind(recipesHandler)
  );

  fastify.put(
    '/recipes/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['Barista', 'Admin'])],
      schema: updateRecipeRouteSchema,
    },
    recipesHandler.updateRecipe.bind(recipesHandler)
  );

  fastify.delete(
    '/recipes/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['Barista', 'Admin'])],
      schema: deleteRecipeRouteSchema,
    },
    recipesHandler.deleteRecipe.bind(recipesHandler)
  );
};
