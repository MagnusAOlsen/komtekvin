import { useEffect, useState } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import type { PlayerStats, Wine } from '../types';
import { fetchPlayers } from '../api';
import { WineGrid } from '../components/WineGrid';
import { AddWineForm } from '../components/AddWineForm';
import { IMG } from '../images';

// A single player's collection — same layout as the Viner page, titled
// "{name} sine viner". Reached from the Stats table.
// In ADMIN mode a wine can be logged straight onto this page; because the
// collection is derived from the wine's `winner`, the same entry also appears
// in the general Viner list.
export function PlayerWinesPage({ name, onBack }: { name: string; onBack: () => void }) {
  const t = useStrings();
  const { isAdmin } = useAdmin();
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPlayers().then((players) => {
      setPlayer(players.find((p) => p.name === name) ?? null);
      setLoaded(true);
    });
  }, [name]);

  function handleSaved(wine: Wine) {
    setAdding(false);
    setPlayer((current) =>
      current ? { ...current, collection: [...current.collection, wine] } : current,
    );
  }

  return (
    <section className="page wines-page">
      <button type="button" className="link-button back-button" onClick={onBack}>
        {t.wines.back}
      </button>
      <div className="player-heading">
        <img className="player-mascot" src={IMG.happyWine} alt="" />
        <h1>{t.wines.playerHeading(name)}</h1>
      </div>

      {isAdmin && (
        <button type="button" className="add-wine-button" onClick={() => setAdding(true)}>
          {t.wines.addWine}
        </button>
      )}

      {loaded && (
        <WineGrid wines={player?.collection ?? []} emptyText={t.wines.playerEmpty(name)} />
      )}

      {adding && (
        <AddWineForm winner={name} onClose={() => setAdding(false)} onSaved={handleSaved} />
      )}
    </section>
  );
}
