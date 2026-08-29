import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';

const FILE = 'wheelNames.json';

// Read/write access module for the wheel name pool (data/wheelNames.json).
export async function readWheelNames(): Promise<string[]> {
  const raw = await readFile(dataFile(FILE), 'utf8');
  return JSON.parse(raw) as string[];
}

async function writeWheelNames(names: string[]): Promise<string[]> {
  await writeFile(dataFile(FILE), JSON.stringify(names, null, 2) + '\n');
  return names;
}

/** True if the name is already on the wheel (ignoring case). */
export async function wheelNameExists(name: string): Promise<boolean> {
  const names = await readWheelNames();
  return names.some((n) => n.toLowerCase() === name.toLowerCase());
}

/** Appends a name to the pool unless an equal name (ignoring case) is there. */
export async function addWheelName(name: string): Promise<string[]> {
  const names = await readWheelNames();
  if (names.some((n) => n.toLowerCase() === name.toLowerCase())) return names;
  names.push(name);
  return writeWheelNames(names);
}

// Removes every entry matching `name` (ignoring case) from the pool. This only
// takes the person off the wheel — their players.json row and its counters stay.
export async function removeWheelName(name: string): Promise<string[]> {
  const names = await readWheelNames();
  const kept = names.filter((n) => n.toLowerCase() !== name.toLowerCase());
  if (kept.length === names.length) return names;
  return writeWheelNames(kept);
}
