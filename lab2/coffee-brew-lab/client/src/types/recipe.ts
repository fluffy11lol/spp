export type BrewMethod =
  | 'V60'
  | 'Aeropress'
  | 'Chemex'
  | 'Origami'
  | 'Espresso'
  | 'French Press'
  | 'Cold Brew'
  | 'Clever';

export type UserRole = 'Taster' | 'Barista' | 'Admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserSession {
  id: string;
  user_id: number;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_email?: string;
  user_role?: string;
}

export interface AuditLog {
  id: number;
  event_type: string;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  ip_address: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface Recipe {
  id: number;
  title: string;
  roaster: string;
  origin: string;
  method: BrewMethod;
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

export interface ApiProblemDetails {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, any>;
  requestId?: string;
  timestamp?: string;
  path?: string;
}
