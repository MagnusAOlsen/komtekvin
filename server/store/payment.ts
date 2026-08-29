import { readFile, writeFile } from 'node:fs/promises';
import { dataFile } from './paths.js';

/** The Vipps details shown on the Payment page; null means "not set yet". */
export interface PaymentSettings {
  /** Amount in kroner. */
  amount: number | null;
  /** The Vipps number to pay to. */
  phone: string | null;
  /** Free-text payment deadline shown in the hint, e.g. "fredag 04.09". */
  deadline: string | null;
  /** Free-text date of the draw shown in the hint, e.g. "lørdag 05.09". */
  drawDate: string | null;
}

const FILE = 'payment.json';
const EMPTY: PaymentSettings = { amount: null, phone: null, deadline: null, drawDate: null };

// Read/write access module for data/payment.json. Missing or unreadable file
// means "nothing configured", so the UI falls back to its placeholders.
export async function readPayment(): Promise<PaymentSettings> {
  try {
    const parsed = JSON.parse(await readFile(dataFile(FILE), 'utf8')) as Partial<PaymentSettings>;
    return {
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      phone: typeof parsed.phone === 'string' && parsed.phone ? parsed.phone : null,
      deadline: typeof parsed.deadline === 'string' && parsed.deadline ? parsed.deadline : null,
      drawDate: typeof parsed.drawDate === 'string' && parsed.drawDate ? parsed.drawDate : null,
    };
  } catch {
    return EMPTY;
  }
}

// Persists the amount/number and the two hint dates. Admin-only (gated in the route).
export async function writePayment(settings: PaymentSettings): Promise<PaymentSettings> {
  await writeFile(dataFile(FILE), JSON.stringify(settings, null, 2) + '\n');
  return settings;
}
