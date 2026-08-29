import path from 'node:path';

// All JSON "database" files live here. Overridable via DATA_DIR so the same
// build works in Docker (bind-mounted /app/data) and local dev (./data).
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'data');

export function dataFile(name: string): string {
  return path.join(DATA_DIR, name);
}
