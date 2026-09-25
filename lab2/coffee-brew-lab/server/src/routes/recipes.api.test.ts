import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:4000';

describe('Backend REST API Integration Tests', () => {
  let createdRecipeId: number;

  it('GET /api/health should return status 200 and ok', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
  });

  it('GET /api/recipes should return 200 and a list of recipes', async () => {
    const res = await fetch(`${API_BASE}/api/recipes`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    assert.ok(body.length > 0);
  });

  it('GET /api/recipes with ?search= filter should filter results', async () => {
    const res = await fetch(`${API_BASE}/api/recipes?search=Ethiopia`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    body.forEach((r: any) => {
      const match =
        r.title.includes('Ethiopia') ||
        r.origin.includes('Ethiopia') ||
        r.roaster.includes('Ethiopia');
      assert.ok(match);
    });
  });

  it('POST /api/recipes with invalid body should return 400 Bad Request and field errors', async () => {
    const invalidPayload = {
      title: 'X', // Too short (< 2 chars)
      roaster: '',
      waterTemperature: 120, // Out of range (> 100°C)
    };

    const res = await fetch(`${API_BASE}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Validation error');
    assert.ok(body.fields);
    assert.ok(body.fields.title);
    assert.ok(body.fields.waterTemperature);
    assert.ok(body.message);
  });

  it('POST /api/recipes with valid payload should return 201 Created', async () => {
    const newRecipe = {
      title: 'Rwanda Gitesi Anaerobic',
      roaster: 'Friedhats Coffee',
      origin: 'Rwanda, Western Province (1800m)',
      method: 'V60',
      coffeeWeight: 15.0,
      waterAmount: 250,
      waterTemperature: 94,
      grindSize: '19 clicks Comandante',
      brewTimeSeconds: 165,
      rating: 5,
      acidity: 4,
      sweetness: 5,
      body: 4,
      tastingNotes: ['Blood Orange', 'Dark Cherry', 'Brown Sugar'],
      processingMethod: 'Anaerobic',
    };

    const res = await fetch(`${API_BASE}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecipe),
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.ok(created.id);
    assert.equal(created.title, newRecipe.title);
    assert.equal(created.roaster, newRecipe.roaster);
    assert.deepEqual(created.tastingNotes, newRecipe.tastingNotes);

    createdRecipeId = created.id;
  });

  it('GET /api/recipes/:id should return 200 and single recipe', async () => {
    assert.ok(createdRecipeId);
    const res = await fetch(`${API_BASE}/api/recipes/${createdRecipeId}`);
    assert.equal(res.status, 200);
    const recipe = await res.json();
    assert.equal(recipe.id, createdRecipeId);
    assert.equal(recipe.title, 'Rwanda Gitesi Anaerobic');
  });

  it('GET /api/recipes/:id with non-existent ID should return 404 Not Found', async () => {
    const res = await fetch(`${API_BASE}/api/recipes/999999`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Recipe not found');
  });

  it('PUT /api/recipes/:id should update fields and return 200 OK', async () => {
    assert.ok(createdRecipeId);
    const updatePayload = {
      title: 'Rwanda Gitesi Anaerobic (Batch 2)',
      roaster: 'Friedhats Coffee',
      origin: 'Rwanda, Western Province',
      method: 'V60',
      coffeeWeight: 16.0,
      waterAmount: 250,
      waterTemperature: 93,
      grindSize: '18 clicks Comandante',
      brewTimeSeconds: 170,
      rating: 5,
      acidity: 5,
      sweetness: 5,
      body: 4,
      tastingNotes: ['Blood Orange', 'Cherry Cordial'],
      processingMethod: 'Anaerobic',
    };

    const res = await fetch(`${API_BASE}/api/recipes/${createdRecipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.title, 'Rwanda Gitesi Anaerobic (Batch 2)');
    assert.equal(updated.coffeeWeight, 16.0);
  });

  it('DELETE /api/recipes/:id should delete recipe and return 200 OK', async () => {
    assert.ok(createdRecipeId);
    const res = await fetch(`${API_BASE}/api/recipes/${createdRecipeId}`, {
      method: 'DELETE',
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, createdRecipeId);

    // Verify subsequent GET returns 404
    const checkRes = await fetch(`${API_BASE}/api/recipes/${createdRecipeId}`);
    assert.equal(checkRes.status, 404);
  });

  it('DELETE /api/recipes/:id with non-existent ID should return 404 Not Found', async () => {
    const res = await fetch(`${API_BASE}/api/recipes/999999`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 404);
  });
});
