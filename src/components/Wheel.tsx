import { useRef, useState } from 'react';
import { useStrings } from '../i18n';
import type { WheelEntry } from '../types';
import { namesFitOnWheel, totalTickets, wheelColor } from '../wheelDisplay';

const R = 96; // wheel radius in SVG units
const EXTRA_TURNS = 5; // full rotations before landing
const SPIN_MS = 4500;

interface WheelProps {
  entries: WheelEntry[];
  onWinner: (name: string, index: number) => void;
  onSpinStart?: () => void;
}

/** A participant's slice of the wheel, in degrees clockwise from the top. */
interface Wedge {
  entry: WheelEntry;
  start: number;
  span: number;
}

function polar(angleDeg: number, radius: number): [number, number] {
  // Angle measured clockwise from the top (12 o'clock), where the pointer sits.
  const rad = (angleDeg * Math.PI) / 180;
  return [Math.sin(rad) * radius, -Math.cos(rad) * radius];
}

// One wedge per participant, sized by their share of all tickets: 3 of 4 tickets
// is three quarters of the wheel. Adjacent wedges start where the previous ended.
function layout(entries: WheelEntry[]): { wedges: Wedge[]; total: number } {
  const total = totalTickets(entries);
  let start = 0;
  const wedges = entries.map((entry) => {
    const span = total > 0 ? (360 * entry.tickets) / total : 360;
    const wedge: Wedge = { entry, start, span };
    start += span;
    return wedge;
  });
  return { wedges, total };
}

// Renders generically from any-length entries array — not hardcoded to a count.
export function Wheel({ entries, onWinner, onSpinStart }: WheelProps) {
  const t = useStrings();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const pendingWinner = useRef<number | null>(null);

  const n = entries.length;
  const { wedges, total } = layout(entries);
  // Base size shrinks with the crowd; each label is capped again by its own
  // wedge below, so a one-ticket sliver next to a big block stays readable.
  const baseFontSize = Math.max(6, Math.min(11, 13 - n * 0.25));

  function spin() {
    if (spinning || n === 0 || total === 0) return;
    // Weighted over every participant every spin — someone holding three tickets
    // is three times as likely as someone holding one. Past winners stay in.
    let ticket = Math.random() * total;
    let winner = n - 1;
    for (let i = 0; i < n; i += 1) {
      ticket -= entries[i].tickets;
      if (ticket < 0) {
        winner = i;
        break;
      }
    }
    const mid = wedges[winner].start + wedges[winner].span / 2;
    const desiredMod = (360 - mid) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += 360;
    pendingWinner.current = winner;
    setSpinning(true);
    onSpinStart?.();
    setRotation(rotation + EXTRA_TURNS * 360 + delta);
  }

  function handleTransitionEnd() {
    if (pendingWinner.current === null) return;
    const winner = pendingWinner.current;
    pendingWinner.current = null;
    setSpinning(false);
    onWinner(entries[winner].name, winner);
  }

  return (
    <div className="wheel">
      <div className="wheel-stage">
        <div className="wheel-pointer" aria-hidden="true" />
        <svg viewBox="-100 -100 200 200" className="wheel-svg">
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* A lone participant — however many tickets they hold — is the whole circle. */}
            {n <= 1 ? (
              <circle cx={0} cy={0} r={R} fill={wheelColor(0)} stroke="#fff" strokeWidth={1} />
            ) : (
              wedges.map(({ start, span }, i) => {
                const [x1, y1] = polar(start, R);
                const [x2, y2] = polar(start + span, R);
                const largeArc = span > 180 ? 1 : 0;
                return (
                  <path
                    key={i}
                    d={`M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={wheelColor(i)}
                    stroke="#fff"
                    strokeWidth={0.8}
                  />
                );
              })
            )}
            {/* Names only while they still fit; on a crowded wheel the labels come
                off entirely and the colour legend identifies people instead. */}
            {namesFitOnWheel(total) &&
              wedges.map(({ entry, start, span }, i) => {
                const [lx, ly] = polar(start + span / 2, R * 0.62);
                // Narrow wedges get proportionally smaller type so the name fits.
                const fontSize = Math.max(4.5, Math.min(baseFontSize, span * 0.4));
                return (
                  <text
                    key={`label-${i}`}
                    x={lx}
                    y={ly}
                    fill="#fff"
                    fontSize={fontSize}
                    fontFamily="Georgia, 'Times New Roman', serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {entry.name}
                    {entry.tickets > 1 && (
                      <tspan x={lx} dy={fontSize * 1.15} fontSize={fontSize * 0.85}>
                        {t.wheel.ticketBadge(entry.tickets)}
                      </tspan>
                    )}
                  </text>
                );
              })}
            <circle cx={0} cy={0} r={6} fill="#fff" />
          </g>
        </svg>
      </div>
      <button type="button" className="spin-button" onClick={spin} disabled={spinning || n === 0}>
        {spinning ? t.wheel.spinning : t.wheel.spin}
      </button>
    </div>
  );
}
