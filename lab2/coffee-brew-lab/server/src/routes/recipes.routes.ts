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

  fastify.post(
    '/recipes',
    { schema: createRecipeRouteSchema },
    recipesHandler.createRecipe.bind(recipesHandler)
  );

  fastify.put(
    '/recipes/:id',
    { schema: updateRecipeRouteSchema },
    recipesHandler.updateRecipe.bind(recipesHandler)
  );

  fastify.delete(
    '/recipes/:id',
    { schema: deleteRecipeRouteSchema },
    recipesHandler.deleteRecipe.bind(recipesHandler)
  );
};

