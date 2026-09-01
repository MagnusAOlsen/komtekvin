import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';

/** One participant on the wheel and how many tickets (lodd) they hold. */
export interface WheelEntry {
  name: string;
  /** Always an integer >= 1; the wedge angle is proportional to this. */
  tickets: number;
}

const FILE = 'wheelNames.json';

/** Coerces a stored value into a valid entry — a bare string means one ticket. */
function normalize(raw: unknown): WheelEntry | null {
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name, tickets: 1 } : null;
  }
  if (raw && typeof raw === 'object') {
    const record = raw as { name?: unknown; tickets?: unknown };
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    if (!name) return null;
    const tickets = Math.floor(Number(record.tickets));
    return { name, tickets: Number.isFinite(tickets) && tickets > 0 ? tickets : 1 };
  }
  return null;
}

// Read/write access module for the wheel pool (data/wheelNames.json).
// The file used to be a plain string[]; normalize() still accepts that shape and
// gives every legacy name one ticket, so no manual migration is needed — the
// first admin write rewrites the file in the object form.
export async function readWheelEntries(): Promise<WheelEntry[]> {
  const raw = JSON.parse(await readFile(dataFile(FILE), 'utf8')) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalize).filter((entry): entry is WheelEntry => entry !== null);
}

async function writeWheelEntries(entries: WheelEntry[]): Promise<WheelEntry[]> {
  await writeFile(dataFile(FILE), JSON.stringify(entries, null, 2) + '\n');
  return entries;
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** True if the name is already on the wheel (ignoring case). */
export async function wheelNameExists(name: string): Promise<boolean> {
  const entries = await readWheelEntries();
  return entries.some((entry) => sameName(entry.name, name));
}

/** Appends a participant unless an equal name (ignoring case) is already there. */
export async function addWheelEntry(name: string, tickets: number): Promise<WheelEntry[]> {
  const entries = await readWheelEntries();
  if (entries.some((entry) => sameName(entry.name, name))) return entries;
  entries.push({ name, tickets: Math.max(1, Math.floor(tickets) || 1) });
  return writeWheelEntries(entries);
}

// Sets a participant's ticket count outright. Zero or less takes them off the
// wheel — same effect as removeWheelName(), so players.json is left alone and
// the person keeps their stats row, counters and won wines.
export async function setTickets(name: string, tickets: number): Promise<WheelEntry[]> {
  const entries = await readWheelEntries();
  const entry = entries.find((candidate) => sameName(candidate.name, name));
  if (!entry) return entries;
  const next = Math.floor(tickets);
  if (!Number.isFinite(next) || next <= 0) {
    return writeWheelEntries(entries.filter((candidate) => candidate !== entry));
  }
  entry.tickets = next;
  return writeWheelEntries(entries);
}

// Spends one ticket, called when a spin is recorded. The winner drops off the
// wheel once their last ticket is used. A no-op for a name not on the wheel.
export async function consumeTicket(name: string): Promise<WheelEntry[]> {
  const entries = await readWheelEntries();
  const entry = entries.find((candidate) => sameName(candidate.name, name));
  if (!entry) return entries;
  return setTickets(entry.name, entry.tickets - 1);
}

// Removes the participant from the pool whatever their ticket count. This only
// takes the person off the wheel — their players.json row and its counters stay.
export async function removeWheelName(name: string): Promise<WheelEntry[]> {
  const entries = await readWheelEntries();
  const kept = entries.filter((entry) => !sameName(entry.name, name));
  if (kept.length === entries.length) return entries;
  return writeWheelEntries(kept);
}
