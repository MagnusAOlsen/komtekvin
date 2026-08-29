import { useState } from 'react';
import type { Wine } from '../types';
import { WineCard } from './WineCard';
import { WineModal } from './WineModal';

// Responsive grid of wine cards + the shared detail modal. Used by both the
// full "Viner" page and a single player's collection page.
export function WineGrid({ wines, emptyText }: { wines: Wine[]; emptyText: string }) {
  const [selected, setSelected] = useState<Wine | null>(null);

  if (wines.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  return (
    <>
      <div className="wine-grid">
        {wines.map((wine) => (
          <WineCard key={wine.id} wine={wine} onOpen={setSelected} />
        ))}
      </div>
      {selected && <WineModal wine={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
