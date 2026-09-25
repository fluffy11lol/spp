import type { Recipe, ApiErrorResponse } from '../types/recipe';

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return res.json();
  }

  let errorData: ApiErrorResponse;
  try {
    errorData = await res.json();
  } catch {
    errorData = { error: res.statusText || 'Unknown server error' };
  }

  const fieldSummary = errorData.fields
    ? Object.entries(errorData.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
    : '';

  const message =
    fieldSummary ||
    errorData.message ||
    errorData.error ||
    `Server error (${res.status})`;

  throw new ApiError(res.status, message, errorData.fields);
}

export async function fetchRecipes(search?: string, method?: string): Promise<Recipe[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (method && method !== 'All') params.append('method', method);

  const url = `/api/recipes${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  return handleResponse<Recipe[]>(res);
}

export async function fetchRecipeById(id: number): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`);
  return handleResponse<Recipe>(res);
}

export async function createRecipe(data: FormData | Record<string, any>): Promise<Recipe> {
  const isFormData = data instanceof FormData;
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse<Recipe>(res);
}

export async function updateRecipe(
  id: number,
  data: FormData | Record<string, any>
): Promise<Recipe> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`/api/recipes/${id}`, {
    method: 'PUT',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse<Recipe>(res);
}

export async function deleteRecipe(id: number): Promise<{ message: string; id: number }> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ message: string; id: number }>(res);
}
