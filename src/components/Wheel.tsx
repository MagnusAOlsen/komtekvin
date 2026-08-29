import { useRef, useState } from 'react';
import { useStrings } from '../i18n';

// Alternating brand-red shades for adjacent segments.
const SEGMENT_COLORS = ['#9c0909', '#c0392b'];
const R = 96; // wheel radius in SVG units
const EXTRA_TURNS = 5; // full rotations before landing
const SPIN_MS = 4500;

interface WheelProps {
  names: string[];
  onWinner: (name: string, index: number) => void;
  onSpinStart?: () => void;
}

function polar(angleDeg: number, radius: number): [number, number] {
  // Angle measured clockwise from the top (12 o'clock), where the pointer sits.
  const rad = (angleDeg * Math.PI) / 180;
  return [Math.sin(rad) * radius, -Math.cos(rad) * radius];
}

// Renders generically from any-length names array — not hardcoded to a count.
export function Wheel({ names, onWinner, onSpinStart }: WheelProps) {
  const t = useStrings();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const pendingWinner = useRef<number | null>(null);

  const n = names.length;
  const seg = n > 0 ? 360 / n : 360;
  const fontSize = Math.max(6, Math.min(11, 13 - n * 0.25));

  function spin() {
    if (spinning || n === 0) return;
    // Uniform over every name every spin, including past winners (no removal).
    const winner = Math.floor(Math.random() * n);
    const mid = winner * seg + seg / 2;
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
    onWinner(names[winner], winner);
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
            {n <= 1 ? (
              <circle cx={0} cy={0} r={R} fill={SEGMENT_COLORS[0]} stroke="#fff" strokeWidth={1} />
            ) : (
              names.map((_, i) => {
                const [x1, y1] = polar(i * seg, R);
                const [x2, y2] = polar((i + 1) * seg, R);
                const largeArc = seg > 180 ? 1 : 0;
                return (
                  <path
                    key={i}
                    d={`M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                    stroke="#fff"
                    strokeWidth={0.8}
                  />
                );
              })
            )}
            {names.map((name, i) => {
              const [lx, ly] = polar(i * seg + seg / 2, R * 0.62);
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
                  {name}
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
