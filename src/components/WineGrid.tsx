import { useState } from 'react';
import type { Wine } from '../types';
import { useAdmin } from '../admin';
import { WineCard } from './WineCard';
import { WineModal } from './WineModal';
import { WineForm } from './WineForm';

interface WineGridProps {
  wines: Wine[];
  emptyText: string;
  /** Called after an admin edit, so the page can refresh its copy of the wine. */
  onWineUpdated?: (wine: Wine) => void;
}

// Responsive grid of wine cards + the shared detail modal. Used by both the
// full "Viner" page and a single player's collection page. In ADMIN mode the
// modal offers an edit form, so both pages get editing from this one place.
export function WineGrid({ wines, emptyText, onWineUpdated }: WineGridProps) {
  const { isAdmin } = useAdmin();
  const [selected, setSelected] = useState<Wine | null>(null);
  const [editing, setEditing] = useState<Wine | null>(null);

  if (wines.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  function handleSaved(wine: Wine) {
    setEditing(null);
    setSelected(null);
    onWineUpdated?.(wine);
  }

  return (
    <>
      <div className="wine-grid">
        {wines.map((wine) => (
          <WineCard key={wine.id} wine={wine} onOpen={setSelected} />
        ))}
      </div>
      {selected && !editing && (
        <WineModal
          wine={selected}
          onClose={() => setSelected(null)}
          onEdit={isAdmin ? () => setEditing(selected) : undefined}
        />
      )}
      {editing && (
        <WineForm
          wine={editing}
          winner={editing.winner}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
