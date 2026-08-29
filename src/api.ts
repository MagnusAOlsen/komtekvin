import type { PaymentSettings, PlayerStats, Wine } from './types';

// Local fallbacks used when the backend is unreachable, so the UI always has
// something to show. The backend serves the authoritative copies from data/.
export const FALLBACK_WHEEL_NAMES: string[] = [
  'Navn 1',
  'Navn 2',
  'Navn 3',
  'Navn 4',
  'Navn 5',
];

export const FALLBACK_WINES: Wine[] = [
  {
    id: 1,
    name: 'Barolo Riserva',
    winner: 'Navn 2',
    year: 2016,
    location: 'Piemonte, Italia',
    date: '15.08.2026',
    price: '349 kr',
    keywords: ['kraftig', 'tanninrik', 'rød'],
    description: 'En kraftig og elegant Nebbiolo med lang ettersmak.',
  },
  {
    id: 2,
    name: 'Whispering Angel Rosé',
    winner: 'Navn 4',
    year: 2022,
    location: 'Provence, Frankrike',
    date: '22.08.2026',
    price: '229 kr',
    keywords: ['frisk', 'bær', 'rosé'],
    description: 'Lett og forfriskende rosé med toner av jordbær og sitrus.',
  },
];

// Derived from FALLBACK_WINES so the two stay consistent offline.
export const FALLBACK_PLAYERS: PlayerStats[] = [
  { name: 'Navn 1', timesPlayed: 5 },
  { name: 'Navn 2', timesPlayed: 6 },
  { name: 'Navn 3', timesPlayed: 4 },
  { name: 'Navn 4', timesPlayed: 5 },
  { name: 'Navn 5', timesPlayed: 3 },
  { name: 'Navn 6', timesPlayed: 2 },
].map((p) => {
  const collection = FALLBACK_WINES.filter((w) => w.winner === p.name);
  return { ...p, timesWon: collection.length, collection };
});

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Falling back to local data for ${url}`, err);
    return fallback;
  }
}

export function fetchWheelNames(): Promise<string[]> {
  return fetchJson<string[]>('/api/wheel-names', FALLBACK_WHEEL_NAMES);
}

export function fetchWines(): Promise<Wine[]> {
  return fetchJson<Wine[]>('/api/wines', FALLBACK_WINES);
}

export function fetchPlayers(): Promise<PlayerStats[]> {
  return fetchJson<PlayerStats[]>('/api/players', FALLBACK_PLAYERS);
}

/** Placeholder settings used until an admin fills in the real amount/number/dates. */
export const FALLBACK_PAYMENT: PaymentSettings = {
  amount: null,
  phone: null,
  deadline: null,
  drawDate: null,
};

export function fetchPayment(): Promise<PaymentSettings> {
  return fetchJson<PaymentSettings>('/api/payment', FALLBACK_PAYMENT);
}

// Stores the Vipps amount and number (admin only). Returns null if it failed.
export async function savePayment(
  settings: PaymentSettings,
  password: string,
): Promise<PaymentSettings | null> {
  try {
    const res = await fetch('/api/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(settings),
    });
    if (!res.ok) return null;
    return (await res.json()) as PaymentSettings;
  } catch (err) {
    console.error('Failed to save payment settings', err);
    return null;
  }
}

/** Validates the admin password. Returns true if correct. */
export async function adminLogin(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Result of an admin write that returns the refreshed wheel pool. */
export type WheelMutation =
  | { ok: true; names: string[] }
  | { ok: false; reason: 'duplicate' | 'failed' };

async function mutateWheelNames(url: string, init: RequestInit): Promise<WheelMutation> {
  try {
    const res = await fetch(url, init);
    if (res.status === 409) return { ok: false, reason: 'duplicate' };
    if (!res.ok) return { ok: false, reason: 'failed' };
    return { ok: true, names: (await res.json()) as string[] };
  } catch (err) {
    console.error(`Wheel update failed for ${url}`, err);
    return { ok: false, reason: 'failed' };
  }
}

// Adds a name to the wheel — and to the stats roster if it is new (admin only).
export function addWheelName(name: string, password: string): Promise<WheelMutation> {
  return mutateWheelNames('/api/wheel-names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
    body: JSON.stringify({ name }),
  });
}

// Takes a name off the wheel only; the stats row and its counters survive (admin only).
export function removeWheelName(name: string, password: string): Promise<WheelMutation> {
  return mutateWheelNames(`/api/wheel-names/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': password },
  });
}

/** What the add-wine form sends; `id` and the stored image URL come back from the server. */
export interface NewWineInput {
  name: string;
  winner: string;
  year?: string;
  location?: string;
  date?: string;
  price?: string;
  keywords?: string;
  description?: string;
  /** Base64 payload of the chosen photo, without the data: prefix. */
  imageData?: string;
  imageExt?: string;
}

export type AddWineResult =
  | { ok: true; wine: Wine }
  | { ok: false; reason: 'too-large' | 'failed' };

// Logs a wine given away (admin only). It is written to wines.json, so it shows
// up both in the winner's collection and in the general wine list.
export async function addWine(input: NewWineInput, password: string): Promise<AddWineResult> {
  try {
    const res = await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(input),
    });
    if (res.status === 413) return { ok: false, reason: 'too-large' };
    if (!res.ok) return { ok: false, reason: 'failed' };
    return { ok: true, wine: (await res.json()) as Wine };
  } catch (err) {
    console.error('Failed to add wine', err);
    return { ok: false, reason: 'failed' };
  }
}

// Records a spin into the stats (admin only). Returns true on success.
export async function recordSpin(winner: string, names: string[], password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/spins/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ winner, names }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
