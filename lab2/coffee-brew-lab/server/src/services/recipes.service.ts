import {
  recipesRepository,
  type RecipeRecord,
  type RecipeFilter,
} from '../repositories/recipes.repository.js';
import { RecipeSchema, type RecipeInput } from '../schemas/recipe.schema.js';
import { deleteFromMinio } from '../utils/storage.js';

export class ServiceError extends Error {
  statusCode: number;
  fields?: Record<string, string>;

  constructor(statusCode: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.fields = fields;
  }
}

export class ValidationError extends ServiceError {
  constructor(fields: Record<string, string>) {
    const message = Object.values(fields).join(', ');
    super(400, message, fields);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = 'Recipe not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class RecipesService {
  async getAllRecipes(filter: RecipeFilter): Promise<RecipeRecord[]> {
    return recipesRepository.findAll(filter);
  }

  async getRecipeById(id: number): Promise<RecipeRecord> {
    const recipe = await recipesRepository.findById(id);
    if (!recipe) {
      throw new NotFoundError();
    }
    return recipe;
  }

  async createRecipe(rawData: any, uploadedImageUrl?: string): Promise<RecipeRecord> {
    const validation = RecipeSchema.safeParse({
      ...rawData,
      imageUrl: uploadedImageUrl || rawData.imageUrl || null,
    });

    if (!validation.success) {
      if (uploadedImageUrl) {
        await deleteFromMinio(uploadedImageUrl);
      }
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0] ? String(issue.path[0]) : 'general';
        fieldErrors[fieldName] = issue.message;
      }
      throw new ValidationError(fieldErrors);
    }

    return recipesRepository.create(validation.data);
  }

  async updateRecipe(
    id: number,
    rawData: any,
    uploadedImageUrl?: string
  ): Promise<RecipeRecord> {
    const current = await recipesRepository.findById(id);
    if (!current) {
      if (uploadedImageUrl) {
        await deleteFromMinio(uploadedImageUrl);
      }
      throw new NotFoundError('Recipe to update not found');
    }

    const targetImageUrl =
      uploadedImageUrl || rawData.imageUrl || current.imageUrl;

    const validation = RecipeSchema.safeParse({
      ...rawData,
      imageUrl: targetImageUrl,
    });

    if (!validation.success) {
      if (uploadedImageUrl) {
        await deleteFromMinio(uploadedImageUrl);
      }
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0] ? String(issue.path[0]) : 'general';
        fieldErrors[fieldName] = issue.message;
      }
      throw new ValidationError(fieldErrors);
    }

    if (
      uploadedImageUrl &&
      current.imageUrl &&
      current.imageUrl !== uploadedImageUrl
    ) {
      await deleteFromMinio(current.imageUrl);
    }

    const updated = await recipesRepository.update(id, validation.data);
    if (!updated) {
      throw new NotFoundError();
    }
    return updated;
  }

  async deleteRecipe(id: number): Promise<{ message: string; id: number }> {
    const current = await recipesRepository.findById(id);
    if (!current) {
      throw new NotFoundError();
    }

    await recipesRepository.delete(id);

    if (current.imageUrl) {
      await deleteFromMinio(current.imageUrl);
    }

    return { message: 'Recipe deleted successfully', id };
  }
}

export const recipesService = new RecipesService();
