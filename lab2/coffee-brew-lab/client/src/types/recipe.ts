export type BrewMethod =
  | 'V60'
  | 'Aeropress'
  | 'Chemex'
  | 'Origami'
  | 'Espresso'
  | 'French Press'
  | 'Cold Brew'
  | 'Clever';

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
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  fields?: Record<string, string>;
}
