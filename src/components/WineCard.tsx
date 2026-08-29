import type { Wine } from '../types';
import { useStrings } from '../i18n';
import { BottlePlaceholder } from './BottlePlaceholder';

// A single wine card in the giveaway-history grid. Clicking it opens the modal.
// Styling mirrors the WineLover reference cards (red border, hover lift).
export function WineCard({ wine, onOpen }: { wine: Wine; onOpen: (wine: Wine) => void }) {
  const t = useStrings();
  const keywords = wine.keywords?.join(', ') ?? '';

  return (
    <button type="button" className="wine-card" onClick={() => onOpen(wine)}>
      {/* The wine's name is the card's header: first in the box, centred. */}
      <h3>{wine.name}</h3>
      {(wine.year || wine.location || wine.date) && (
        <div className="place-year-date">
          <span>{[wine.year, wine.location].filter(Boolean).join(', ')}</span>
          {wine.date && <span>{wine.date}</span>}
        </div>
      )}
      <div className="wine-card-image">
        {wine.img ? (
          <img src={wine.img} alt={wine.name} />
        ) : (
          <BottlePlaceholder className="wine-card-image" />
        )}
      </div>
      <p className="wine-winner">
        {t.wines.winnerLabel}: <strong>{wine.winner}</strong>
      </p>
      {keywords && <p className="wine-keywords">{keywords}</p>}
      {wine.description && <p className="wine-description">{wine.description}</p>}
    </button>
  );
}
