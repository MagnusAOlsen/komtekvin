import { useEffect } from 'react';
import type { Wine } from '../types';
import { useStrings } from '../i18n';
import { BottlePlaceholder } from './BottlePlaceholder';

interface WineModalProps {
  wine: Wine;
  onClose: () => void;
  /** Opens the edit form. Passed only in ADMIN mode; the button is hidden otherwise. */
  onEdit?: () => void;
}

// Centered detail modal with a backdrop, mirroring the reference project's
// showFullWine() interaction. Closes on backdrop click, the ✕ button, or Escape.
export function WineModal({ wine, onClose, onEdit }: WineModalProps) {
  const t = useStrings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const keywords = wine.keywords?.join(', ') ?? '';

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="full-wine"
        role="dialog"
        aria-modal="true"
        aria-label={wine.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="full-wine-close" aria-label={t.wines.close} onClick={onClose}>
          ✕
        </button>
        {(wine.year || wine.location || wine.date) && (
          <div className="place-year-date">
            <span>{[wine.year, wine.location].filter(Boolean).join(', ')}</span>
            {wine.date && <span>{wine.date}</span>}
          </div>
        )}
        <h2>{wine.name}</h2>
        <div className="full-wine-image">
          {wine.img ? <img src={wine.img} alt={wine.name} /> : <BottlePlaceholder />}
        </div>
        <p>
          <strong>{t.wines.winnerLabel}:</strong> {wine.winner}
        </p>
        {wine.price && (
          <p>
            <strong>{t.wines.priceLabel}:</strong> {wine.price}
          </p>
        )}
        {keywords && (
          <p>
            <strong>{t.wines.keywordsLabel}:</strong> {keywords}
          </p>
        )}
        {wine.description && <p>{wine.description}</p>}
        {onEdit && (
          <button type="button" className="add-wine-button full-wine-edit" onClick={onEdit}>
            {t.wines.editWine}
          </button>
        )}
      </div>
    </div>
  );
}
