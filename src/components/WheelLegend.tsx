import { useEffect } from 'react';
import { useStrings } from '../i18n';
import type { WheelEntry } from '../types';
import { wheelColor } from '../wheelDisplay';

// Maps colour → person for a wheel too crowded to carry names. Rendered twice:
// as a column beside the wheel on a computer, and inside a full-screen overlay
// on a phone. Both use the list below, so the two can never drift apart.
export function WheelLegend({ entries }: { entries: WheelEntry[] }) {
  const t = useStrings();

  // A wedge's colour comes from its position in `entries`, so the original index
  // has to survive the sort — hence a copy carrying it rather than sorting in
  // place. Sorted by name because looking up your own name is the whole point.
  const rows = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name, 'nb'));

  return (
    <ul className="legend-list">
      {rows.map(({ entry, index }) => (
        <li key={entry.name} className="legend-item">
          <span
            className="legend-swatch"
            style={{ background: wheelColor(index) }}
            role="img"
            aria-label={t.wheel.colorOf(entry.name)}
          />
          <span className="legend-name">{entry.name}</span>
          <span className="legend-tickets">{t.wheel.ticketCount(entry.tickets)}</span>
        </li>
      ))}
    </ul>
  );
}

interface OverlayProps {
  entries: WheelEntry[];
  onClose: () => void;
}

// The phone version, opened by the "Se hvilken farge du er" button. Same backdrop
// interaction as WineModal: closes on backdrop click, the ✕ button, or Escape.
export function WheelLegendOverlay({ entries, onClose }: OverlayProps) {
  const t = useStrings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop legend-overlay" onClick={onClose}>
      <div
        className="legend-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t.wheel.colorsHeading}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="full-wine-close"
          aria-label={t.wheel.closeColors}
          onClick={onClose}
        >
          ✕
        </button>
        <h2>{t.wheel.colorsHeading}</h2>
        <WheelLegend entries={entries} />
      </div>
    </div>
  );
}
