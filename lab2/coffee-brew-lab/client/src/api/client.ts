import type { Recipe, User, UserSession, AuditLog, ApiProblemDetails } from '../types/recipe';

export class ApiError extends Error {
  status: number;
  details?: Record<string, any>;
  requestId?: string;

  constructor(status: number, message: string, details?: Record<string, any>, requestId?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.name = 'ApiError';
  }
}

let currentAccessToken: string | null = localStorage.getItem('brewlog_access_token');
let currentRefreshToken: string | null = localStorage.getItem('brewlog_refresh_token');

export function setAuthTokens(accessToken: string | null, refreshToken?: string | null) {
  currentAccessToken = accessToken;
  if (accessToken) {
    localStorage.setItem('brewlog_access_token', accessToken);
  } else {
    localStorage.removeItem('brewlog_access_token');
  }

  if (refreshToken !== undefined) {
    currentRefreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem('brewlog_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('brewlog_refresh_token');
    }
  }
}

export function getStoredRefreshToken(): string | null {
  return currentRefreshToken || localStorage.getItem('brewlog_refresh_token');
}

export function getStoredAccessToken(): string | null {
  return currentAccessToken || localStorage.getItem('brewlog_access_token');
}

async function requestWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (currentAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  let res = await fetch(url, { ...options, headers });

  // Handle token expiration & automatic refresh
  if (res.status === 401 && currentRefreshToken && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAuthTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

        // Retry original request with newly acquired access token
        headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
        res = await fetch(url, { ...options, headers });
      } else {
        setAuthTokens(null, null);
      }
    } catch {
      setAuthTokens(null, null);
    }
  }

  return res;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return {} as T;
  }

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = { error: res.statusText || 'Server error' };
  }

  if (res.ok) {
    return body;
  }

  // Handle RFC 7807 problem details or custom backend error formats
  const problem = body as ApiProblemDetails;
  let formattedDetails = '';

  if (problem.details) {
    formattedDetails = Object.entries(problem.details)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
  }

  const message =
    formattedDetails ||
    problem.message ||
    problem.error ||
    `Server request failed with status ${res.status}`;

  throw new ApiError(res.status, message, problem.details, problem.requestId);
}

// ------------------- Recipe API Methods -------------------

export async function fetchRecipes(search?: string, method?: string): Promise<Recipe[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (method && method !== 'All') params.append('method', method);

  const url = `/api/recipes${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await requestWithAuth(url);
  return handleResponse<Recipe[]>(res);
}

export async function fetchRecipeById(id: number): Promise<Recipe> {
  const res = await requestWithAuth(`/api/recipes/${id}`);
  return handleResponse<Recipe>(res);
}

export async function createRecipe(data: FormData | Record<string, any>): Promise<Recipe> {
  const isFormData = data instanceof FormData;
  const res = await requestWithAuth('/api/recipes', {
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
  const res = await requestWithAuth(`/api/recipes/${id}`, {
    method: 'PUT',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse<Recipe>(res);
}

export async function deleteRecipe(id: number): Promise<{ message: string; id: number }> {
  const res = await requestWithAuth(`/api/recipes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ message: string; id: number }>(res);
}

// ------------------- Auth API Methods -------------------

export async function loginUser(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: User;
  sessionId: string;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<{ data: any }>(res);
  setAuthTokens(data.data.accessToken, data.data.refreshToken);
  return data.data;
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: 'Taster' | 'Barista'
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: User;
  sessionId: string;
}> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role }),
  });
  const data = await handleResponse<{ data: any }>(res);
  setAuthTokens(data.data.accessToken, data.data.refreshToken);
  return data.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await requestWithAuth('/api/auth/logout', { method: 'POST' });
  } finally {
    setAuthTokens(null, null);
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await requestWithAuth('/api/auth/me');
  const data = await handleResponse<{ data: User }>(res);
  return data.data;
}

export async function fetchActiveSessions(): Promise<{
  sessions: UserSession[];
  currentSessionId?: string;
}> {
  const res = await requestWithAuth('/api/auth/sessions');
  const data = await handleResponse<{ data: UserSession[]; currentSessionId?: string }>(res);
  return {
    sessions: data.data,
    currentSessionId: data.currentSessionId,
  };
}

export async function revokeActiveSession(sessionId: string): Promise<void> {
  const res = await requestWithAuth(`/api/auth/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(res);
}

export async function requestPasswordReset(email: string): Promise<string> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await handleResponse<{ message: string }>(res);
  return data.message;
}

export async function submitPasswordReset(token: string, newPassword: string): Promise<string> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await handleResponse<{ message: string }>(res);
  return data.message;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await requestWithAuth('/api/admin/audit-logs');
  const data = await handleResponse<{ data: AuditLog[] }>(res);
  return data.data;
}
