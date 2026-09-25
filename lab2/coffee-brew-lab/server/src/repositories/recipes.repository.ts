import { pool } from '../db/index.js';

export interface RecipeRecord {
  id: number;
  title: string;
  roaster: string;
  origin: string;
  method: string;
  coffeeWeight: number;
  waterAmount: number;
  waterTemperature: number;
  grindSize: string;
  brewTimeSeconds: number;
  rating: number;
  acidity: number;
  sweetness: number;
  body: number;
  tastingNotes: string[];
  imageUrl?: string | null;
  processingMethod?: string;
  authorId?: number | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeDTO {
  title: string;
  roaster: string;
  origin: string;
  method: string;
  coffeeWeight: number;
  waterAmount: number;
  waterTemperature: number;
  grindSize: string;
  brewTimeSeconds: number;
  rating: number;
  acidity: number;
  sweetness: number;
  body: number;
  tastingNotes: string[];
  imageUrl?: string | null;
  processingMethod?: string;
  authorId?: number | null;
  authorName?: string | null;
}

export interface RecipeFilter {
  search?: string;
  method?: string;
}

export class RecipesRepository {
  async findAll(filter: RecipeFilter): Promise<RecipeRecord[]> {
    let query = `
      SELECT 
        id, title, roaster, origin, method,
        coffee_weight AS "coffeeWeight",
        water_amount AS "waterAmount",
        water_temperature AS "waterTemperature",
        grind_size AS "grindSize",
        brew_time_seconds AS "brewTimeSeconds",
        rating, acidity, sweetness, body,
        tasting_notes AS "tastingNotes",
        image_url AS "imageUrl",
        processing_method AS "processingMethod",
        author_id AS "authorId",
        author_name AS "authorName",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM recipes
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.search && filter.search.trim()) {
      params.push(`%${filter.search.trim()}%`);
      query += ` AND (title ILIKE $${params.length} OR roaster ILIKE $${params.length} OR origin ILIKE $${params.length})`;
    }

    if (filter.method && filter.method !== 'All') {
      params.push(filter.method);
      query += ` AND method = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(id: number): Promise<RecipeRecord | null> {
    const result = await pool.query(
      `SELECT 
        id, title, roaster, origin, method,
        coffee_weight AS "coffeeWeight",
        water_amount AS "waterAmount",
        water_temperature AS "waterTemperature",
        grind_size AS "grindSize",
        brew_time_seconds AS "brewTimeSeconds",
        rating, acidity, sweetness, body,
        tasting_notes AS "tastingNotes",
        image_url AS "imageUrl",
        processing_method AS "processingMethod",
        author_id AS "authorId",
        author_name AS "authorName",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM recipes WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async create(data: CreateRecipeDTO): Promise<RecipeRecord> {
    const result = await pool.query(
      `INSERT INTO recipes (
        title, roaster, origin, method, coffee_weight, water_amount,
        water_temperature, grind_size, brew_time_seconds, rating,
        acidity, sweetness, body, tasting_notes, processing_method, image_url,
        author_id, author_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING 
        id, title, roaster, origin, method,
        coffee_weight AS "coffeeWeight",
        water_amount AS "waterAmount",
        water_temperature AS "waterTemperature",
        grind_size AS "grindSize",
        brew_time_seconds AS "brewTimeSeconds",
        rating, acidity, sweetness, body,
        tasting_notes AS "tastingNotes",
        image_url AS "imageUrl",
        processing_method AS "processingMethod",
        author_id AS "authorId",
        author_name AS "authorName",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        data.title,
        data.roaster,
        data.origin,
        data.method,
        data.coffeeWeight,
        data.waterAmount,
        data.waterTemperature,
        data.grindSize,
        data.brewTimeSeconds,
        data.rating,
        data.acidity,
        data.sweetness,
        data.body,
        data.tastingNotes,
        data.processingMethod,
        data.imageUrl,
        data.authorId || null,
        data.authorName || 'Master Barista',
      ]
    );

    return result.rows[0];
  }

  async update(id: number, data: CreateRecipeDTO): Promise<RecipeRecord | null> {
    const result = await pool.query(
      `UPDATE recipes SET
        title = $1,
        roaster = $2,
        origin = $3,
        method = $4,
        coffee_weight = $5,
        water_amount = $6,
        water_temperature = $7,
        grind_size = $8,
        brew_time_seconds = $9,
        rating = $10,
        acidity = $11,
        sweetness = $12,
        body = $13,
        tasting_notes = $14,
        processing_method = $15,
        image_url = $16,
        updated_at = NOW()
      WHERE id = $17
      RETURNING 
        id, title, roaster, origin, method,
        coffee_weight AS "coffeeWeight",
        water_amount AS "waterAmount",
        water_temperature AS "waterTemperature",
        grind_size AS "grindSize",
        brew_time_seconds AS "brewTimeSeconds",
        rating, acidity, sweetness, body,
        tasting_notes AS "tastingNotes",
        image_url AS "imageUrl",
        processing_method AS "processingMethod",
        author_id AS "authorId",
        author_name AS "authorName",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        data.title,
        data.roaster,
        data.origin,
        data.method,
        data.coffeeWeight,
        data.waterAmount,
        data.waterTemperature,
        data.grindSize,
        data.brewTimeSeconds,
        data.rating,
        data.acidity,
        data.sweetness,
        data.body,
        data.tastingNotes,
        data.processingMethod,
        data.imageUrl,
        id,
      ]
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM recipes WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const recipesRepository = new RecipesRepository();
