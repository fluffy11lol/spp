import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RecipeSchema } from './recipe.schema.js';

describe('RecipeSchema Validation Tests', () => {
  const validRecipe = {
    title: 'Panama Geisha Boquete',
    roaster: 'Hacienda La Esmeralda',
    origin: 'Panama, Boquete',
    method: 'V60',
    coffeeWeight: 15.5,
    waterAmount: 250,
    waterTemperature: 93,
    grindSize: '18 clicks (Comandante)',
    brewTimeSeconds: 165,
    rating: 5,
    acidity: 5,
    sweetness: 5,
    body: 4,
    tastingNotes: ['Jasmine', 'Bergamot', 'Peach'],
    processingMethod: 'Washed',
  };

  it('should accept a completely valid recipe object', () => {
    const result = RecipeSchema.safeParse(validRecipe);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, 'Panama Geisha Boquete');
      assert.equal(result.data.coffeeWeight, 15.5);
      assert.equal(result.data.origin, 'Panama, Boquete');
    }
  });

  it('should fallback origin to "Single Origin" if omitted or blank', () => {
    const withoutOrigin = { ...validRecipe, origin: '' };
    const result = RecipeSchema.safeParse(withoutOrigin);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.origin, 'Single Origin');
    }
  });

  it('should reject a title shorter than 2 characters', () => {
    const invalid = { ...validRecipe, title: 'A' };
    const result = RecipeSchema.safeParse(invalid);
    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title');
      assert.ok(issue);
      assert.match(issue.message, /at least 2 characters/i);
    }
  });

  it('should reject an empty roaster name', () => {
    const invalid = { ...validRecipe, roaster: '' };
    const result = RecipeSchema.safeParse(invalid);
    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'roaster');
      assert.ok(issue);
    }
  });

  it('should reject an invalid brew method enum', () => {
    const invalid = { ...validRecipe, method: 'MicrowaveDrip' };
    const result = RecipeSchema.safeParse(invalid);
    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'method');
      assert.ok(issue);
      assert.match(issue.message, /valid brew method/i);
    }
  });

  it('should reject out-of-range coffee weight (< 5g or > 100g)', () => {
    const tooSmall = { ...validRecipe, coffeeWeight: 2 };
    const tooLarge = { ...validRecipe, coffeeWeight: 150 };

    const resSmall = RecipeSchema.safeParse(tooSmall);
    const resLarge = RecipeSchema.safeParse(tooLarge);

    assert.equal(resSmall.success, false);
    assert.equal(resLarge.success, false);
  });

  it('should reject out-of-range water temperature (< 60°C or > 100°C)', () => {
    const tooCold = { ...validRecipe, waterTemperature: 45 };
    const tooHot = { ...validRecipe, waterTemperature: 105 };

    assert.equal(RecipeSchema.safeParse(tooCold).success, false);
    assert.equal(RecipeSchema.safeParse(tooHot).success, false);
  });

  it('should reject invalid brew time (< 10s or > 1800s)', () => {
    const tooShort = { ...validRecipe, brewTimeSeconds: 5 };
    assert.equal(RecipeSchema.safeParse(tooShort).success, false);
  });

  it('should parse JSON stringified tasting notes array', () => {
    const withJsonNotes = {
      ...validRecipe,
      tastingNotes: JSON.stringify(['Floral', 'Lemongrass']),
    };
    const result = RecipeSchema.safeParse(withJsonNotes);
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.tastingNotes, ['Floral', 'Lemongrass']);
    }
  });

  it('should parse comma-separated tasting notes string', () => {
    const withCsvNotes = {
      ...validRecipe,
      tastingNotes: 'Vanilla, Roasted Almond, Honey',
    };
    const result = RecipeSchema.safeParse(withCsvNotes);
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.tastingNotes, [
        'Vanilla',
        'Roasted Almond',
        'Honey',
      ]);
    }
  });
});
