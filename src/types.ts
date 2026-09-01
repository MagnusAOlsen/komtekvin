// Shared domain types used by both the API layer and the UI.

export interface Wine {
  id: number;
  /** The wine given away. */
  name: string;
  /** The class member who won this wine — this is a giveaway log, not a catalogue. */
  winner: string;
  year?: number | null;
  location?: string;
  /** When it was given out, e.g. "22.08.2026". */
  date?: string;
  price?: string;
  keywords?: string[];
  description?: string;
  /** Optional bottle image URL; a placeholder is shown when absent. */
  img?: string | null;
}

/** One participant on the wheel; the wedge angle is proportional to `tickets`. */
export interface WheelEntry {
  name: string;
  /** Tickets (lodd) held — always an integer >= 1. A win spends one. */
  tickets: number;
}

export interface PlayerStats {
  name: string;
  timesPlayed: number;
  timesWon: number;
  /** The wines this player has won. */
  collection: Wine[];
}

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
