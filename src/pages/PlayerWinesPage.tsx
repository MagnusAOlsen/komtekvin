import { useEffect, useState } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import type { PlayerStats, Wine } from '../types';
import { fetchPlayers } from '../api';
import { WineGrid } from '../components/WineGrid';
import { WineForm } from '../components/WineForm';
import { PlayerStatsChart } from '../components/PlayerStatsChart';
import { IMG } from '../images';

// A single player's collection — their play/win chart on the left, the bottles
// they have won on the right, titled "{name} sine viner". Reached by clicking
// a name in the Stats table.
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

  // The winner is pickable in the form, so a wine logged here can still end up
  // in somebody else's collection — same rule as an edit that reassigns it.
  function handleSaved(wine: Wine) {
    setAdding(false);
    if (wine.winner !== name) return;
    setPlayer((current) =>
      current ? { ...current, collection: [...current.collection, wine] } : current,
    );
  }

  // A collection is derived from the wine's `winner`, so an edit that reassigns
  // the winner moves the bottle out of this page and into the new owner's.
  function handleUpdated(updated: Wine) {
    setPlayer((current) => {
      if (!current) return current;
      const collection =
        updated.winner === name
          ? current.collection.map((wine) => (wine.id === updated.id ? updated : wine))
          : current.collection.filter((wine) => wine.id !== updated.id);
      return { ...current, collection };
    });
  }

  return (
    <section className="page wines-page">
      <button type="button" className="link-button back-button" onClick={onBack}>
        {t.wines.back}
      </button>
      {/* Heading, chart and bottles all sit in the grid so their order can
          change with the breakpoint — on a phone the chart comes first, above
          the heading. See .player-layout's grid-template-areas. */}
      <div className="player-layout">
        <div className="player-heading">
          <img className="player-mascot" src={IMG.happyWine} alt="" />
          <h1>{t.wines.playerHeading(name)}</h1>
        </div>

        <aside className="player-chart-col">
          {player && (
            <PlayerStatsChart timesPlayed={player.timesPlayed} timesWon={player.timesWon} />
          )}
        </aside>

        <div className="player-collection">
          {isAdmin && (
            <button type="button" className="add-wine-button" onClick={() => setAdding(true)}>
              {t.wines.addWine}
            </button>
          )}
          {loaded && (
            <WineGrid
              wines={player?.collection ?? []}
              emptyText={t.wines.playerEmpty(name)}
              onWineUpdated={handleUpdated}
            />
          )}
        </div>
      </div>

      {adding && (
        <WineForm winner={name} onClose={() => setAdding(false)} onSaved={handleSaved} />
      )}
    </section>
  );
}
