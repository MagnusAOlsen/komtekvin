import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';

export interface SpinEntry {
  winner: string;
  /** ISO timestamp of when the spin landed. */
  at: string;
}

const FILE = 'spinLog.json';

async function readSpinLog(): Promise<SpinEntry[]> {
  try {
    return JSON.parse(await readFile(dataFile(FILE), 'utf8')) as SpinEntry[];
  } catch {
    return [];
  }
}

// Optional history log — appends a spin result with a timestamp. Kept isolated
// so the read endpoints don't depend on it.
export async function appendSpin(winner: string): Promise<SpinEntry> {
  const entry: SpinEntry = { winner, at: new Date().toISOString() };
  const log = await readSpinLog();
  log.push(entry);
  await writeFile(dataFile(FILE), JSON.stringify(log, null, 2) + '\n');
  return entry;
}
