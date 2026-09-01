import type { WheelEntry } from './types';

// How the wheel presents its participants — the rules the wheel itself, the
// colour legend and the admin roster chips all have to agree on.

// Twenty well-separated colours, ordered so that neighbouring list positions come
// from different colour families: a wedge's colour is picked by its index, so
// adjacent entries are adjacent on the wheel and must not look alike. The first
// three are the brand tokens from :root. All are mid-dark and saturated, so the
// white wedge borders and the gold ring around the wheel still read against them.
const PALETTE = [
  '#9c0909', // wine red (brand)
  '#1f77b4', // blue
  '#c9930a', // gold (brand)
  '#2e7d32', // green
  '#6a1b9a', // grape (brand)
  '#e07b39', // orange
  '#0f7f7f', // teal
  '#b5177f', // magenta
  '#4a5fc1', // indigo
  '#7f8c1a', // olive
  '#c0392b', // brick
  '#00867d', // sea green
  '#8d4b24', // brown
  '#d81b60', // pink
  '#3949ab', // royal blue
  '#00796b', // dark teal
  '#a1520a', // amber brown
  '#5d8a1f', // leaf
  '#7b1fa2', // violet
  '#455a64', // slate
];

/** The colour for a participant at `index` in the wheel's entries array. */
export function wheelColor(index: number): string {
  if (index < PALETTE.length) return PALETTE[index];
  // Past the palette, walk the colour wheel by the golden angle so an unbounded
  // roster keeps getting well-separated hues instead of repeating.
  return `hsl(${(index * 137.508) % 360} 62% 42%)`;
}

/** Every ticket on the wheel — what the wedge angles are shares of. */
export function totalTickets(entries: WheelEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.tickets, 0);
}

// Whether names still fit inside the wedges. Wedges are sized by ticket share, so
// the smallest one is 360/total degrees — three people holding 6 + 1 + 1 cramp a
// name just as badly as eight people with one each. Above this the wheel drops
// all its text and the colour legend identifies people instead.
export function namesFitOnWheel(tickets: number): boolean {
  return tickets <= 8;
}
