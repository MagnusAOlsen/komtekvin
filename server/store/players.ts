import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';
import type { Wine } from './wines.js';

/** A player as stored on disk (data/players.json). */
export interface PlayerRecord {
  name: string;
  timesPlayed: number;
  timesWon: number;
}

/** A player enriched with their won-wine collection (derived from wines.json). */
export interface PlayerStats extends PlayerRecord {
  collection: Wine[];
}

const FILE = 'players.json';

async function readPlayerRecords(): Promise<PlayerRecord[]> {
  const raw = await readFile(dataFile(FILE), 'utf8');
  return JSON.parse(raw) as PlayerRecord[];
}

async function writePlayerRecords(players: PlayerRecord[]): Promise<PlayerRecord[]> {
  await writeFile(dataFile(FILE), JSON.stringify(players, null, 2) + '\n');
  return players;
}

// Attaches each player's wine collection (wines whose `winner` matches the name).
// timesPlayed / timesWon are stored counters, updated only via recordRound().
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
    player = { name, timesPlayed: 0, timesWon: 0 };
    players.push(player);
  }
  return player;
}

// Records one lottery round: everyone in `names` played once, `winner` won once.
// Persists players.json and returns the updated roster. Admin-only (gated in the route).
export async function recordRound(names: string[], winner: string): Promise<PlayerRecord[]> {
  const players = await readPlayerRecords();
  for (const name of names) {
    findOrCreate(players, name).timesPlayed += 1;
  }
  findOrCreate(players, winner).timesWon += 1;
  return writePlayerRecords(players);
}

// Adds a new player with zeroed counters, keeping an existing row (and its
// counters) untouched if the name is already known. Admin-only via the route.
export async function addPlayer(name: string): Promise<PlayerRecord[]> {
  const players = await readPlayerRecords();
  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return players;
  players.push({ name, timesPlayed: 0, timesWon: 0 });
  return writePlayerRecords(players);
}
