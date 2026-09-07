import { useEffect, useState } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import type { Wine } from '../types';
import { fetchWines } from '../api';
import { WineGrid } from '../components/WineGrid';
import { WineForm } from '../components/WineForm';

// Right page — a responsive grid logging the wines given out so far.
// The page title lives in the app header.
// In ADMIN mode a wine can be logged from here for anyone on the roster; the
// winner is picked in the form, so this works even for someone with no wines
// yet (their collection page would otherwise be the only way in).
export function WineListPage() {
  const t = useStrings();
  const { isAdmin } = useAdmin();
  const [wines, setWines] = useState<Wine[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWines().then(setWines);
  }, []);

  // An admin edit can change any field, so swap the whole wine in by id.
  function handleUpdated(updated: Wine) {
    setWines((current) => current.map((wine) => (wine.id === updated.id ? updated : wine)));
  }

  function handleSaved(wine: Wine) {
    setAdding(false);
    setWines((current) => [...current, wine]);
  }

  return (
    <section className="page wines-page">
      {/* Outside WineGrid on purpose: the grid returns the empty text early, so
          a button inside it would disappear exactly when it is needed most. */}
      {isAdmin && (
        <button type="button" className="add-wine-button" onClick={() => setAdding(true)}>
          {t.wines.addWine}
        </button>
      )}

      <WineGrid wines={wines} emptyText={t.wines.empty} onWineUpdated={handleUpdated} />

      {adding && <WineForm onClose={() => setAdding(false)} onSaved={handleSaved} />}
    </section>
  );
}
