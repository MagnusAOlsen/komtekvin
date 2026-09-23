import { useEffect, useMemo, useState } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import type { PlayerStats } from '../types';
import { fetchPlayers, removePlayer, setPlayerTickets } from '../api';

// Right-most page — a leaderboard of everyone who has played the lottery.
// Clicking a name opens that person's collection page, which is the only way
// in — so it must work for someone who has not won anything yet.
// Read-only except in ADMIN mode, which turns the lodd cell into a field and
// adds a per-row remove button. The wheel is where lodd are normally counted
// (joining or stepping the ticket count up buys them); the field here is the
// correction for a number counted outside the app. Removing a name on the wheel
// page keeps the stats row — removing it here is the full deletion.
export function StatsPage({ onViewPlayer }: { onViewPlayer: (name: string) => void }) {
  const t = useStrings();
  const { isAdmin, password } = useAdmin();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  // The one cell being edited, if any — only one field is open at a time, so a
  // single draft is enough to keep the typed text out of the players list.
  const [draft, setDraft] = useState<{ name: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPlayers().then(setPlayers);
  }, []);

  // Most wins first, then most lodd bought; the name breaks the remaining
  // ties so the order does not drift between reloads.
  const ranked = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          b.timesWon - a.timesWon ||
          b.ticketsBought - a.ticketsBought ||
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

  // Called when a lodd field is left (Enter blurs it too). Closing the draft
  // first makes Escape — which clears it before blurring — a plain cancel, and
  // keeps the blur that follows Enter from saving the same value twice.
  async function handleTickets(player: PlayerStats) {
    if (!password || !draft || draft.name !== player.name) return;
    const value = Math.floor(Number(draft.value));
    setDraft(null);
    if (!Number.isFinite(value) || value < 0 || value === player.ticketsBought) return;
    setBusy(true);
    const refreshed = await setPlayerTickets(player.name, value, password);
    setBusy(false);
    if (refreshed) {
      setPlayers(refreshed);
      setError(null);
    } else {
      setError(t.stats.ticketsFailed);
    }
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
                <th>{t.stats.colTickets}</th>
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
                  <td className="num">
                    {isAdmin ? (
                      <input
                        type="number"
                        min={0}
                        className="stats-tickets"
                        aria-label={t.stats.editTickets(player.name)}
                        title={t.stats.editTickets(player.name)}
                        disabled={busy}
                        value={
                          draft?.name === player.name
                            ? draft.value
                            : String(player.ticketsBought)
                        }
                        onChange={(e) =>
                          setDraft({ name: player.name, value: e.target.value })
                        }
                        onBlur={() => handleTickets(player)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') {
                            setDraft(null);
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    ) : (
                      player.ticketsBought
                    )}
                  </td>
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
