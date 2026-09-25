import type { PoolClient } from 'pg';
import { minioClient, BUCKET_NAME } from '../utils/minio.js';

export async function seedInitialData(client: PoolClient): Promise<void> {
  const countRes = await client.query('SELECT COUNT(*) FROM recipes');
  const count = parseInt(countRes.rows[0].count, 10);
  if (count > 0) {
    return;
  }

  await ensureDefaultMinioImages();

  const initialRecipes = [
    {
      title: 'Ethiopia Yirgacheffe Chelchele',
      roaster: 'Submarine Coffee Roasters',
      origin: 'Ethiopia, Gedeo (2000–2200m)',
      method: 'V60',
      coffee_weight: 15.0,
      water_amount: 250.0,
      water_temperature: 93,
      grind_size: '18 clicks (Comandante C40)',
      brew_time_seconds: 165,
      rating: 5,
      acidity: 5,
      sweetness: 4,
      body: 3,
      tasting_notes: ['Bergamot', 'Jasmine', 'White Peach', 'Black Tea'],
      processing_method: 'Washed',
      image_url: '/uploads/ethiopia-chelchele.svg',
    },
    {
      title: 'Colombia Geisha Finca El Paraiso',
      roaster: 'The Barn Berlin',
      origin: 'Colombia, Cauca (1950m)',
      method: 'Origami',
      coffee_weight: 16.0,
      water_amount: 240.0,
      water_temperature: 91,
      grind_size: '20 clicks (Comandante)',
      brew_time_seconds: 180,
      rating: 5,
      acidity: 5,
      sweetness: 5,
      body: 4,
      tasting_notes: ['Red Currant', 'Rose Petals', 'Lychee', 'Wild Strawberry'],
      processing_method: 'Anaerobic',
      image_url: '/uploads/colombia-geisha.svg',
    },
    {
      title: 'Kenya Nyeri Hill Peaberry',
      roaster: 'Square Mile Coffee',
      origin: 'Kenya, Nyeri (1800m)',
      method: 'V60',
      coffee_weight: 15.5,
      water_amount: 250.0,
      water_temperature: 95,
      grind_size: '19 clicks (Comandante)',
      brew_time_seconds: 170,
      rating: 4,
      acidity: 5,
      sweetness: 3,
      body: 4,
      tasting_notes: ['Pink Grapefruit', 'Blackcurrant', 'Rhubarb', 'Rosehip'],
      processing_method: 'Washed',
      image_url: '/uploads/kenya-nyeri.svg',
    },
    {
      title: 'Costa Rica Las Lajas Black Diamond',
      roaster: 'Silky Drum Roasters',
      origin: 'Costa Rica, Central Valley (1450m)',
      method: 'Aeropress',
      coffee_weight: 18.0,
      water_amount: 200.0,
      water_temperature: 88,
      grind_size: '14 clicks (Fine-Medium)',
      brew_time_seconds: 120,
      rating: 5,
      acidity: 3,
      sweetness: 5,
      body: 5,
      tasting_notes: ['Ripe Plum', 'Dark Chocolate', 'Aged Rum', 'Dried Fig'],
      processing_method: 'Black Honey',
      image_url: '/uploads/costa-rica.svg',
    },
    {
      title: 'Guatemala Huehuetenango La Bolsa',
      roaster: 'Tim Wendelboe',
      origin: 'Guatemala, Huehuetenango (1600m)',
      method: 'Chemex',
      coffee_weight: 30.0,
      water_amount: 500.0,
      water_temperature: 94,
      grind_size: '24 clicks (Coarse)',
      brew_time_seconds: 240,
      rating: 4,
      acidity: 4,
      sweetness: 4,
      body: 4,
      tasting_notes: ['Red Apple', 'Salted Caramel', 'Walnut', 'Milk Chocolate'],
      processing_method: 'Washed',
      image_url: '/uploads/guatemala.svg',
    },
  ];

  for (const r of initialRecipes) {
    await client.query(
      `INSERT INTO recipes (
        title, roaster, origin, method, coffee_weight, water_amount,
        water_temperature, grind_size, brew_time_seconds, rating,
        acidity, sweetness, body, tasting_notes, processing_method, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        r.title,
        r.roaster,
        r.origin,
        r.method,
        r.coffee_weight,
        r.water_amount,
        r.water_temperature,
        r.grind_size,
        r.brew_time_seconds,
        r.rating,
        r.acidity,
        r.sweetness,
        r.body,
        r.tasting_notes,
        r.processing_method,
        r.image_url,
      ]
    );
  }
}

async function ensureDefaultMinioImages(): Promise<void> {
  const images = [
    {
      filename: 'ethiopia-chelchele.svg',
      gradient: ['#F59E0B', '#D97706'],
      accent: '#FDE68A',
      title: 'ETHIOPIA',
      subtitle: 'CHELCHELE WASHED',
      roaster: 'SUBMARINE',
    },
    {
      filename: 'colombia-geisha.svg',
      gradient: ['#EC4899', '#BE185D'],
      accent: '#FBCFE8',
      title: 'COLOMBIA',
      subtitle: 'GEISHA ANAEROBIC',
      roaster: 'THE BARN',
    },
    {
      filename: 'kenya-nyeri.svg',
      gradient: ['#EF4444', '#B91C1C'],
      accent: '#FECACA',
      title: 'KENYA',
      subtitle: 'NYERI PEABERRY',
      roaster: 'SQUARE MILE',
    },
    {
      filename: 'costa-rica.svg',
      gradient: ['#8B5CF6', '#6D28D9'],
      accent: '#DDD6FE',
      title: 'COSTA RICA',
      subtitle: 'LAS LAJAS HONEY',
      roaster: 'SILKY DRUM',
    },
    {
      filename: 'guatemala.svg',
      gradient: ['#10B981', '#047857'],
      accent: '#A7F3D0',
      title: 'GUATEMALA',
      subtitle: 'LA BOLSA WASHED',
      roaster: 'TIM WENDELBOE',
    },
  ];

  for (const img of images) {
    try {
      await minioClient.statObject(BUCKET_NAME, img.filename);
    } catch {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="bg-${img.filename}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${img.gradient[0]}" />
      <stop offset="100%" stop-color="${img.gradient[1]}" />
    </linearGradient>
    <radialGradient id="bean" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${img.accent}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${img.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="500" fill="#18181B" rx="24"/>
  <rect x="20" y="20" width="360" height="460" fill="url(#bg-${img.filename})" rx="16" opacity="0.95"/>
  <circle cx="200" cy="220" r="140" fill="url(#bean)"/>
  <path d="M170 180 C 170 150, 230 150, 230 180 C 230 220, 170 240, 170 270 C 170 300, 230 300, 230 270" stroke="${img.accent}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/>
  <text x="200" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="4" fill="${img.accent}" text-anchor="middle">${img.roaster}</text>
  <text x="200" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle">${img.title}</text>
  <text x="200" y="415" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" letter-spacing="2" fill="${img.accent}" text-anchor="middle">${img.subtitle}</text>
  <rect x="150" y="440" width="100" height="4" rx="2" fill="${img.accent}" opacity="0.8"/>
</svg>`;
      const buffer = Buffer.from(svg, 'utf-8');
      await minioClient.putObject(
        BUCKET_NAME,
        img.filename,
        buffer,
        buffer.length,
        { 'Content-Type': 'image/svg+xml' }
      );
    }
  }
}
