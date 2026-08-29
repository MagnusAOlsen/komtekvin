import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';

// Uploaded wine photos live inside the data directory, not in the build output:
// data/ is the bind-mounted volume in Docker, so images survive a rebuild.
// They are served at /uploads/... (see server/index.ts).
export const UPLOAD_DIR = dataFile('uploads');
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif']);

/** Filename-safe stem derived from the wine name, e.g. "Barolo Riserva" → "barolo-riserva". */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export class ImageTooLargeError extends Error {}

/**
 * Writes a base64-encoded image into data/uploads and returns its public URL.
 * The extension is whitelisted and the stem is generated, so nothing from the
 * client reaches the filesystem verbatim.
 */
export async function saveWineImage(name: string, base64: string, ext?: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new ImageTooLargeError('Image too large');

  const lower = (ext ?? '').toLowerCase();
  const safeExt = ALLOWED_EXT.has(lower) ? lower : 'png';
  const filename = `${slug(name) || 'vin'}-${Date.now()}.${safeExt}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
