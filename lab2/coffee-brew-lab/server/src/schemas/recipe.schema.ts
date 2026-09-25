import { z } from 'zod';

export const RecipeSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  roaster: z
    .string({ required_error: 'Roaster is required' })
    .trim()
    .min(2, 'Roaster name must be at least 2 characters')
    .max(100, 'Roaster name cannot exceed 100 characters'),
  origin: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : 'Single Origin')),
  method: z.enum(
    [
      'V60',
      'Aeropress',
      'Chemex',
      'Origami',
      'Espresso',
      'French Press',
      'Cold Brew',
      'Clever',
    ],
    {
      errorMap: () => ({
        message:
          'Please select a valid brew method (V60, Aeropress, Chemex, Origami, Espresso, French Press, Cold Brew, Clever)',
      }),
    }
  ),
  coffeeWeight: z.coerce
    .number({ invalid_type_error: 'Coffee weight must be a number' })
    .min(5, 'Coffee weight must be between 5g and 100g')
    .max(100, 'Coffee weight must be between 5g and 100g'),
  waterAmount: z.coerce
    .number({ invalid_type_error: 'Water amount must be a number' })
    .min(30, 'Water amount must be between 30ml and 2000ml')
    .max(2000, 'Water amount must be between 30ml and 2000ml'),
  waterTemperature: z.coerce
    .number({ invalid_type_error: 'Water temperature must be a number' })
    .int('Water temperature must be an integer')
    .min(60, 'Water temperature must be between 60°C and 100°C')
    .max(100, 'Water temperature must be between 60°C and 100°C'),
  grindSize: z
    .string({ required_error: 'Grind size is required' })
    .trim()
    .min(1, 'Please specify grind size (e.g. 18 clicks Comandante)'),
  brewTimeSeconds: z.coerce
    .number({ invalid_type_error: 'Brew time must be a number' })
    .int('Brew time must be in whole seconds')
    .min(10, 'Brew time must be between 10s and 1800s')
    .max(1800, 'Brew time must be between 10s and 1800s'),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  acidity: z.coerce.number().int().min(1).max(5).default(3),
  sweetness: z.coerce.number().int().min(1).max(5).default(3),
  body: z.coerce.number().int().min(1).max(5).default(3),
  tastingNotes: z
    .array(z.string())
    .or(
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      })
    )
    .default([]),
  processingMethod: z.string().optional().default('Washed'),
  imageUrl: z.string().optional().nullable(),
});

export type RecipeInput = z.infer<typeof RecipeSchema>;
