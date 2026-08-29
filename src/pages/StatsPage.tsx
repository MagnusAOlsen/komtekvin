import { useEffect, useState } from 'react';
import { useStrings } from '../i18n';
import type { PlayerStats } from '../types';
import { fetchPlayers } from '../api';

// Right-most page — a table of everyone who has played the lottery.
// The "Se X viner" link is the only way into a player's collection.
// Read-only: the roster is edited on the wheel page (admin mode), and a name
// taken off the wheel still keeps its row and counters here.
export function StatsPage({ onViewPlayer }: { onViewPlayer: (name: string) => void }) {
  const t = useStrings();
  const [players, setPlayers] = useState<PlayerStats[]>([]);

  useEffect(() => {
    fetchPlayers().then(setPlayers);
  }, []);

  return (
    <section className="page stats-page">
      {players.length === 0 ? (
        <p className="empty">{t.stats.empty}</p>
      ) : (
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>{t.stats.colName}</th>
                <th>{t.stats.colPlayed}</th>
                <th>{t.stats.colWon}</th>
                <th>{t.stats.colCollection}</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.name}>
                  {/* Plain text: only the collection link navigates. */}
                  <td className="player-name">{player.name}</td>
                  <td className="num">{player.timesPlayed}</td>
                  <td className="num">{player.timesWon}</td>
                  <td>
                    {player.collection.length > 0 ? (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => onViewPlayer(player.name)}
                      >
                        {t.stats.viewCollection(player.collection.length)}
                      </button>
                    ) : (
                      <span className="muted">{t.stats.noCollection}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
