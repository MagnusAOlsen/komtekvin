import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';
import type { Wine } from './wines.js';

/** A player as stored on disk (data/players.json). */
export interface PlayerRecord {
  name: string;
  /** Total lodd bought — counted where tickets are bought, never on a spin. */
  ticketsBought: number;
  timesWon: number;
}

/** A player enriched with their won-wine collection (derived from wines.json). */
export interface PlayerStats extends PlayerRecord {
  collection: Wine[];
}

const FILE = 'players.json';

const count = (value: unknown): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// The counter used to be `timesPlayed` (rounds played). It now holds lodd bought,
// and the stored numbers carry straight over, so a legacy key is read as-is — no
// manual migration needed, the first write rewrites the file in the new shape.
function normalize(raw: unknown): PlayerRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) return null;
  return {
    name,
    ticketsBought: count(record.ticketsBought ?? record.timesPlayed),
    timesWon: count(record.timesWon),
  };
}

async function readPlayerRecords(): Promise<PlayerRecord[]> {
  const raw = JSON.parse(await readFile(dataFile(FILE), 'utf8')) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalize).filter((player): player is PlayerRecord => player !== null);
}

async function writePlayerRecords(players: PlayerRecord[]): Promise<PlayerRecord[]> {
  await writeFile(dataFile(FILE), JSON.stringify(players, null, 2) + '\n');
  return players;
}

// Attaches each player's wine collection (wines whose `winner` matches the name).
// ticketsBought / timesWon are stored counters, written only by the functions below.
export function computeStats(players: PlayerRecord[], wines: Wine[]): PlayerStats[] {
  return players.map((player) => ({
    ...player,
    collection: wines.filter((wine) => wine.winner === player.name),
  }));
}

export async function readPlayers(): Promise<PlayerRecord[]> {
  return readPlayerRecords();
}

function findOrCreate(players: PlayerRecord[], name: string): PlayerRecord {
  let player = players.find((p) => p.name === name);
  if (!player) {
    player = { name, ticketsBought: 0, timesWon: 0 };
    players.push(player);
  }
  return player;
}

// Records a win: the only thing a spin moves. Rounds played are not counted at
// all any more — the other number in the table is lodd bought, which changes
// where tickets are bought (see addTickets), not when the wheel turns.
// Admin-only (gated in the route).
export async function recordWin(winner: string): Promise<PlayerRecord[]> {
  const players = await readPlayerRecords();
  findOrCreate(players, winner).timesWon += 1;
  return writePlayerRecords(players);
}

// Moves the lodd counter by `delta`, creating the row if the name is new. Called
// from the wheel routes: buying tickets adds, stepping the count back down
// subtracts, so a misclick on − undoes itself. Never goes below zero.
export async function addTickets(name: string, delta: number): Promise<PlayerRecord[]> {
  if (!Number.isFinite(delta) || delta === 0) return readPlayerRecords();
  const players = await readPlayerRecords();
  const player = findOrCreate(players, name);
  player.ticketsBought = Math.max(0, player.ticketsBought + Math.floor(delta));
  return writePlayerRecords(players);
}

// Sets the lodd counter outright — what the admin field in the stats table does,
// so a number counted wrong (or bought before this counter existed) can be fixed.
export async function setTicketsBought(name: string, tickets: number): Promise<PlayerRecord[]> {
  const players = await readPlayerRecords();
  findOrCreate(players, name).ticketsBought = Math.max(0, Math.floor(tickets));
  return writePlayerRecords(players);
}

// Adds a new player with zeroed counters, keeping an existing row (and its
// counters) untouched if the name is already known. Admin-only via the route.
export async function addPlayer(name: string): Promise<PlayerRecord[]> {
  const players = await readPlayerRecords();
  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return players;
  players.push({ name, ticketsBought: 0, timesWon: 0 });
  return writePlayerRecords(players);
}

// Drops a player's row and its counters for good. Unlike taking a name off the
// wheel — which deliberately keeps the stats row — this is the full removal, so
// the route also clears them off the wheel and unassigns their wines. Matching
// is case-insensitive, like addPlayer's duplicate check. Admin-only via the route.
export async function removePlayer(name: string): Promise<PlayerRecord[]> {
  const players = await readPlayerRecords();
  const lower = name.toLowerCase();
  return writePlayerRecords(players.filter((p) => p.name.toLowerCase() !== lower));
}
