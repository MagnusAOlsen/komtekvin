import { useEffect, useMemo, useState } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import type { PlayerStats } from '../types';
import { fetchPlayers, removePlayer } from '../api';

// Right-most page — a leaderboard of everyone who has played the lottery.
// Clicking a name opens that person's collection page, which is the only way
// in — so it must work for someone who has not won anything yet.
// Read-only except in ADMIN mode, which adds a per-row remove button. The
// roster is otherwise edited on the wheel page, where removing a name keeps the
// stats row; removing it here is the full deletion (see handleRemove).
export function StatsPage({ onViewPlayer }: { onViewPlayer: (name: string) => void }) {
  const t = useStrings();
  const { isAdmin, password } = useAdmin();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers().then(setPlayers);
  }, []);

  // Most wins first, then most rounds played; the name breaks the remaining
  // ties so the order does not drift between reloads.
  const ranked = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          b.timesWon - a.timesWon ||
          b.timesPlayed - a.timesPlayed ||
          a.name.localeCompare(b.name, 'nb'),
      ),
    [players],
  );

  // Irreversible: the counters go, the wines fall back to "ikke valgt" and the
  // name leaves the wheel — hence the confirmation. The server answers with the
  // refreshed list, so the table redraws from the authoritative copy.
  async function handleRemove(name: string) {
    if (!password) return;
    if (!window.confirm(t.stats.confirmRemovePlayer(name))) return;
    setError(null);
    const refreshed = await removePlayer(name, password);
    if (refreshed) setPlayers(refreshed);
    else setError(t.stats.removeFailed);
  }

  return (
    <section className="page stats-page">
      {ranked.length === 0 ? (
        <p className="empty">{t.stats.empty}</p>
      ) : (
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>{t.stats.colName}</th>
                <th>{t.stats.colPlayed}</th>
                <th>{t.stats.colWon}</th>
                {isAdmin && <th>{t.stats.colRemove}</th>}
              </tr>
            </thead>
            <tbody>
              {ranked.map((player) => (
                <tr key={player.name}>
                  <td className="player-name">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onViewPlayer(player.name)}
                    >
                      {player.name}
                    </button>
                  </td>
                  <td className="num">{player.timesPlayed}</td>
                  <td className="num">{player.timesWon}</td>
                  {isAdmin && (
                    <td className="num">
                      <button
                        type="button"
                        className="stats-remove"
                        aria-label={t.stats.removePlayer(player.name)}
                        title={t.stats.removePlayer(player.name)}
                        onClick={() => handleRemove(player.name)}
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="add-wine-error">{error}</p>}
    </section>
  );
}
