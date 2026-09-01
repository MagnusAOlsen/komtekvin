import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';

export interface Wine {
  id: number;
  name: string;
  winner: string;
  year?: number | null;
  location?: string;
  date?: string;
  price?: string;
  keywords?: string[];
  description?: string;
  img?: string | null;
}

/** Everything a new giveaway entry needs; `id` is assigned here. */
export type NewWine = Omit<Wine, 'id'>;

const FILE = 'wines.json';

// Read/write access module for the giveaway log (data/wines.json).
export async function readWines(): Promise<Wine[]> {
  const raw = await readFile(dataFile(FILE), 'utf8');
  return JSON.parse(raw) as Wine[];
}

// Appends one wine to the log with the next free id. Because a player's
// collection is derived by matching `winner`, the new bottle shows up both on
// that player's page and in the general wine list. Admin-only (gated in the route).
export async function addWine(input: NewWine): Promise<Wine> {
  const wines = await readWines();
  const nextId = wines.reduce((max, w) => Math.max(max, Number(w.id) || 0), 0) + 1;
  const wine: Wine = { id: nextId, ...input };
  wines.push(wine);
  await writeFile(dataFile(FILE), JSON.stringify(wines, null, 2) + '\n');
  return wine;
}

// Replaces the mutable fields of an existing wine, keeping its id. `img` is only
// overwritten when the patch carries it, so an edit without a new photo keeps the
// previously uploaded one. Returns null when the id is unknown. Admin-only (gated
// in the route). Note this can move a bottle between collections — they are
// derived by matching `winner` — but never touches the timesWon counters.
export async function updateWine(id: number, patch: Partial<NewWine>): Promise<Wine | null> {
  const wines = await readWines();
  const index = wines.findIndex((w) => Number(w.id) === id);
  if (index === -1) return null;
  const wine: Wine = { ...wines[index], ...patch, id: wines[index].id };
  wines[index] = wine;
  await writeFile(dataFile(FILE), JSON.stringify(wines, null, 2) + '\n');
  return wine;
}
