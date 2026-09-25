import crypto from 'crypto';
import path from 'path';
import type { FastifyRequest } from 'fastify';
import { uploadToMinio, deleteFromMinio } from './minio.js';

export interface ParsedMultipartResult {
  fields: Record<string, any>;
  imageUrl?: string;
}

export async function parseMultipartRecipe(
  req: FastifyRequest
): Promise<ParsedMultipartResult> {
  const parts = req.parts();
  const fields: Record<string, any> = {};
  let imageUrl: string | undefined;

  for await (const part of parts) {
    if (part.type === 'file') {
      if (!part.mimetype.startsWith('image/')) {
        await part.toBuffer();
        throw new Error('Only image files are allowed (JPG, PNG, WebP)');
      }

      const ext = path.extname(part.filename) || '.jpg';
      const safeFilename = `${crypto.randomUUID()}${ext}`;
      const buffer = await part.toBuffer();

      imageUrl = await uploadToMinio(buffer, safeFilename, part.mimetype);
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, imageUrl };
}

export { deleteFromMinio, deleteFromMinio as deleteFile };
