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

  return (
    <section className="page wines-page">
      <WineGrid wines={wines} emptyText={t.wines.empty} />
    </section>
  );
}
