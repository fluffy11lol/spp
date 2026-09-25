import {
  recipesRepository,
  type RecipeRecord,
  type RecipeFilter,
} from '../repositories/recipes.repository.js';
import { RecipeSchema, type RecipeInput } from '../schemas/recipe.schema.js';
import { deleteFromMinio } from '../utils/storage.js';
import { auditRepository } from '../repositories/audit.repository.js';

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
    super(422, message, fields);
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message = 'Access forbidden: Insufficient permissions for this resource') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = 'Recipe not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export interface CurrentUserContext {
  id: number;
  email: string;
  role: string;
  name: string;
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

  async createRecipe(
    rawData: any,
    uploadedImageUrl?: string,
    currentUser?: CurrentUserContext,
    ipAddress?: string
  ): Promise<RecipeRecord> {
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

    const payload = {
      ...validation.data,
      authorId: currentUser?.id ?? null,
      authorName: currentUser?.name || currentUser?.email || 'Master Barista',
    };

    const created = await recipesRepository.create(payload);

    await auditRepository.log({
      eventType: 'RECIPE_CREATED',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      ipAddress,
      details: { recipeId: created.id, title: created.title, method: created.method },
    });

    return created;
  }

  async updateRecipe(
    id: number,
    rawData: any,
    uploadedImageUrl?: string,
    currentUser?: CurrentUserContext,
    ipAddress?: string
  ): Promise<RecipeRecord> {
    const current = await recipesRepository.findById(id);
    if (!current) {
      if (uploadedImageUrl) {
        await deleteFromMinio(uploadedImageUrl);
      }
      throw new NotFoundError('Recipe to update not found');
    }

    // Role-based authorization check: Baristas can only edit their own recipes; Admins can edit any
    if (currentUser && currentUser.role !== 'Admin') {
      if (current.authorId && current.authorId !== currentUser.id) {
        if (uploadedImageUrl) {
          await deleteFromMinio(uploadedImageUrl);
        }
        await auditRepository.log({
          eventType: 'ACCESS_DENIED_RECIPE_UPDATE',
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          ipAddress,
          details: { recipeId: id, ownerId: current.authorId },
        });
        throw new ForbiddenError('You can only edit recipes you created');
      }
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

    await auditRepository.log({
      eventType: 'RECIPE_UPDATED',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      ipAddress,
      details: { recipeId: id, title: updated.title },
    });

    return updated;
  }

  async deleteRecipe(
    id: number,
    currentUser?: CurrentUserContext,
    ipAddress?: string
  ): Promise<{ message: string; id: number }> {
    const current = await recipesRepository.findById(id);
    if (!current) {
      throw new NotFoundError();
    }

    // Role-based authorization check: Baristas can only delete their own recipes; Admins can delete any
    if (currentUser && currentUser.role !== 'Admin') {
      if (current.authorId && current.authorId !== currentUser.id) {
        await auditRepository.log({
          eventType: 'ACCESS_DENIED_RECIPE_DELETE',
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          ipAddress,
          details: { recipeId: id, ownerId: current.authorId },
        });
        throw new ForbiddenError('You can only delete recipes you created');
      }
    }

    await recipesRepository.delete(id);

    if (current.imageUrl) {
      await deleteFromMinio(current.imageUrl);
    }

    await auditRepository.log({
      eventType: 'RECIPE_DELETED',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      ipAddress,
      details: { recipeId: id, title: current.title },
    });

    return { message: 'Recipe deleted successfully', id };
  }
}

export const recipesService = new RecipesService();
