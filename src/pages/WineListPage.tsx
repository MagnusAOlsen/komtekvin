import { useEffect, useState } from 'react';
import { useStrings } from '../i18n';
import type { Wine } from '../types';
import { fetchWines } from '../api';
import { WineGrid } from '../components/WineGrid';

// Right page — a responsive grid logging the wines given out so far.
// The page title lives in the app header.
export function WineListPage() {
  const t = useStrings();
  const [wines, setWines] = useState<Wine[]>([]);

  useEffect(() => {
    fetchWines().then(setWines);
  }, []);

  // An admin edit can change any field, so swap the whole wine in by id.
  function handleUpdated(updated: Wine) {
    setWines((current) => current.map((wine) => (wine.id === updated.id ? updated : wine)));
  }

  return (
    <section className="page wines-page">
      <WineGrid wines={wines} emptyText={t.wines.empty} onWineUpdated={handleUpdated} />
    </section>
  );
}
