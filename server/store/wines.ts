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

/**
 * Winner written on a bottle whose owner has been removed from the stats.
 * It deliberately matches no player, so the wine keeps its place in the Viner
 * list while belonging to nobody's collection until an admin reassigns it.
 */
export const UNASSIGNED_WINNER = 'ikke valgt';

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

// Hands every bottle won by `name` over to `UNASSIGNED_WINNER` — what removing
// someone from the stats does to their collection. Matching is case-insensitive
// so a row whose case drifted from the wine's `winner` is still caught.
// Returns how many bottles were reassigned. Admin-only (gated in the route).
export async function unassignWinesOf(name: string): Promise<number> {
  const wines = await readWines();
  const lower = name.toLowerCase();
  let reassigned = 0;
  for (const wine of wines) {
    if (wine.winner.toLowerCase() !== lower) continue;
    wine.winner = UNASSIGNED_WINNER;
    reassigned += 1;
  }
  if (reassigned > 0) {
    await writeFile(dataFile(FILE), JSON.stringify(wines, null, 2) + '\n');
  }
  return reassigned;
}
