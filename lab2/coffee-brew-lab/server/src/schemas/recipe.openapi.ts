export const recipeResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    title: { type: 'string', example: 'Ethiopia Yirgacheffe' },
    roaster: { type: 'string', example: 'The Barn Berlin' },
    origin: { type: 'string', example: 'Ethiopia, Gedeo Zone (2000m)' },
    method: {
      type: 'string',
      enum: ['V60', 'Aeropress', 'Chemex', 'Origami', 'Espresso', 'French Press', 'Cold Brew', 'Clever'],
      example: 'V60',
    },
    coffeeWeight: { type: 'number', example: 15.0 },
    waterAmount: { type: 'integer', example: 250 },
    waterTemperature: { type: 'integer', example: 93 },
    grindSize: { type: 'string', example: '18 clicks (Comandante C40)' },
    brewTimeSeconds: { type: 'integer', example: 165 },
    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
    acidity: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
    sweetness: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
    body: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
    tastingNotes: {
      type: 'array',
      items: { type: 'string' },
      example: ['Bergamot', 'Jasmine', 'Peach'],
    },
    imageUrl: { type: 'string', nullable: true, example: 'http://localhost:4000/uploads/bag.png' },
    processingMethod: { type: 'string', example: 'Washed' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', example: 'Validation error' },
    message: { type: 'string', example: 'Invalid input parameters' },
    fields: {
      type: 'object',
      additionalProperties: { type: 'string' },
      example: { title: 'Title must be at least 2 characters long' },
    },
  },
};

export const listRecipesRouteSchema = {
  tags: ['Recipes'],
  summary: 'List all coffee recipes with optional filters',
  querystring: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search query for title, roaster, or origin' },
      method: { type: 'string', description: 'Filter by brew method (e.g. V60, Aeropress)' },
    },
  },
  response: {
    200: {
      description: 'List of recipes matching the filter',
      type: 'array',
      items: recipeResponseSchema,
    },
  },
};

export const getRecipeRouteSchema = {
  tags: ['Recipes'],
  summary: 'Retrieve a single coffee recipe by ID',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'Numeric recipe ID' },
    },
  },
  response: {
    200: {
      description: 'Recipe details found',
      ...recipeResponseSchema,
    },
    400: {
      description: 'Invalid ID parameter format',
      ...errorResponseSchema,
    },
    404: {
      description: 'Recipe not found',
      ...errorResponseSchema,
    },
  },
};

export const createRecipeRouteSchema = {
  tags: ['Recipes'],
  summary: 'Create a new coffee recipe (supports application/json and multipart/form-data)',
  response: {
    201: {
      description: 'Recipe created successfully',
      ...recipeResponseSchema,
    },
    400: {
      description: 'Input validation error or invalid file format',
      ...errorResponseSchema,
    },
  },
};

export const updateRecipeRouteSchema = {
  tags: ['Recipes'],
  summary: 'Update an existing coffee recipe by ID',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'Numeric recipe ID' },
    },
  },
  response: {
    200: {
      description: 'Recipe successfully updated',
      ...recipeResponseSchema,
    },
    400: {
      description: 'Validation error',
      ...errorResponseSchema,
    },
    404: {
      description: 'Recipe not found',
      ...errorResponseSchema,
    },
  },
};

export const deleteRecipeRouteSchema = {
  tags: ['Recipes'],
  summary: 'Delete a coffee recipe and its associated MinIO photo',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'Numeric recipe ID' },
    },
  },
  response: {
    200: {
      description: 'Recipe successfully deleted',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Recipe successfully deleted' },
        id: { type: 'integer', example: 1 },
      },
    },
    400: {
      description: 'Invalid recipe ID format',
      ...errorResponseSchema,
    },
    404: {
      description: 'Recipe not found',
      ...errorResponseSchema,
    },
  },
};
