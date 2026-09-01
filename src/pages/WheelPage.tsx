import { useEffect, useState, type FormEvent } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import { Wheel } from '../components/Wheel';
import { WheelLegend, WheelLegendOverlay } from '../components/WheelLegend';
import {
  fetchWheelEntries,
  recordSpin,
  addWheelName,
  removeWheelName,
  setWheelTickets,
} from '../api';
import type { WheelEntry } from '../types';
import { namesFitOnWheel, totalTickets, wheelColor } from '../wheelDisplay';
import { IMG } from '../images';

// Middle page (default) — the spinning wheel that draws a winner.
// Each participant holds a number of tickets (lodd) and covers that share of the
// wheel. Once there are too many tickets for names to fit inside the wedges, the
// wheel goes wordless and a colour legend takes over — beside the wheel on a
// computer, behind a button on a phone.
// In ADMIN mode the list below the wheel is editable: adding a name also creates
// their stats row, while removing one only takes them off the wheel — the stats
// table keeps the person and their counters.
export function WheelPage() {
  const t = useStrings();
  const { isAdmin, password, logout } = useAdmin();
  const [entries, setEntries] = useState<WheelEntry[]>([]);
  // The winner's colour is captured at win time: recording the spin spends a
  // ticket and can drop them off the wheel, which invalidates their index.
  const [winner, setWinner] = useState<{ name: string; color: string } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTickets, setNewTickets] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchWheelEntries().then(setEntries);
  }, []);

  // The legend exists exactly when the wheel has given up on names.
  const showLegend = entries.length > 0 && !namesFitOnWheel(totalTickets(entries));

  async function handleWinner(name: string, index: number) {
    setWinner({ name, color: wheelColor(index) });
    setSpinning(false);
    // The stats table is only updated in ADMIN mode — and that same call spends
    // the winner's ticket, so we redraw from the pool the server sends back.
    if (isAdmin && password) {
      const wheel = await recordSpin(name, entries.map((entry) => entry.name), password);
      if (wheel) setEntries(wheel);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !password || busy) return;
    setBusy(true);
    const result = await addWheelName(name, Number(newTickets) || 1, password);
    setBusy(false);
    if (result.ok) {
      setEntries(result.entries);
      setNewName('');
      setNewTickets('1');
      setError(null);
    } else {
      setError(result.reason === 'duplicate' ? t.wheel.addDuplicate : t.wheel.addFailed);
    }
  }

  async function handleTickets(name: string, tickets: number) {
    if (!password || busy) return;
    setBusy(true);
    const result = await setWheelTickets(name, tickets, password);
    setBusy(false);
    if (result.ok) {
      setEntries(result.entries);
      setError(null);
    } else {
      setError(t.wheel.ticketsFailed);
    }
  }

  async function handleRemove(name: string) {
    if (!password || busy) return;
    if (!window.confirm(t.wheel.confirmRemove(name))) return;
    setBusy(true);
    const result = await removeWheelName(name, password);
    setBusy(false);
    if (result.ok) {
      setEntries(result.entries);
      setError(null);
    } else {
      setError(t.wheel.removeFailed);
    }
  }

  return (
    <section className="page wheel-page">
      {isAdmin && (
        <button type="button" className="admin-badge" title={t.admin.exitHint} onClick={logout}>
          {t.admin.badge}
        </button>
      )}

      {/* Two columns once the legend is on; a single centred one otherwise, which
          is the layout the page has always had. */}
      <div className="wheel-layout">
        {showLegend && (
          <aside className="wheel-legend">
            <h2 className="legend-heading">{t.wheel.colorsHeading}</h2>
            <WheelLegend entries={entries} />
          </aside>
        )}

        <div className="wheel-main">
          <h1>{t.wheel.heading}</h1>
          {entries.length === 0 ? (
            <p className="empty">{t.wheel.empty}</p>
          ) : (
            <>
              <Wheel
                entries={entries}
                onWinner={handleWinner}
                onSpinStart={() => {
                  setWinner(null);
                  setSpinning(true);
                }}
              />
              {/* The phone counterpart of the legend column; CSS shows exactly
                  one of the two, so a resize needs no JS. */}
              {showLegend && (
                <button
                  type="button"
                  className="legend-open"
                  onClick={() => setLegendOpen(true)}
                >
                  {t.wheel.showColors}
                </button>
              )}
              {!isAdmin && <p className="admin-hint">{t.admin.getRights}</p>}
              {winner && (
                <>
                  {/* Confetti covers the whole screen on a win. */}
                  <div className="confetti-fullscreen" aria-hidden="true">
                    <img src={IMG.confettiGif} alt="" />
                  </div>
                  <div className="winner-announcement" role="status">
                    <p className="winner-label">{t.wheel.winnerLabel}</p>
                    <p className="winner-name">
                      {showLegend && (
                        <span
                          className="winner-swatch"
                          style={{ background: winner.color }}
                          role="img"
                          aria-label={t.wheel.colorOf(winner.name)}
                        />
                      )}
                      {winner.name}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        // Editing while the wheel turns would change the segment the pointer is
        // heading for, so the whole editor is disabled during a spin.
        <div className="roster">
          <h2 className="roster-heading">{t.wheel.rosterHeading}</h2>
          <ul className="roster-chips">
            {entries.map(({ name, tickets }, index) => (
              <li key={name} className="roster-chip">
                {/* The chip's wedge colour, so an admin can always tie the two
                    together — including while the wheel still shows names. */}
                <span
                  className="roster-swatch"
                  style={{ background: wheelColor(index) }}
                  role="img"
                  aria-label={t.wheel.colorOf(name)}
                />
                <span className="roster-chip-name">{name}</span>
                {/* Stepping down to zero is removal, which the ✕ already does
                    (with a confirm), so − stops at one. */}
                <button
                  type="button"
                  className="roster-ticket"
                  aria-label={t.wheel.removeTicket(name)}
                  title={t.wheel.removeTicket(name)}
                  disabled={busy || spinning || tickets <= 1}
                  onClick={() => handleTickets(name, tickets - 1)}
                >
                  −
                </button>
                <span className="roster-tickets">{t.wheel.ticketCount(tickets)}</span>
                <button
                  type="button"
                  className="roster-ticket"
                  aria-label={t.wheel.addTicket(name)}
                  title={t.wheel.addTicket(name)}
                  disabled={busy || spinning}
                  onClick={() => handleTickets(name, tickets + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="roster-remove"
                  aria-label={t.wheel.removeName(name)}
                  title={t.wheel.removeName(name)}
                  disabled={busy || spinning}
                  onClick={() => handleRemove(name)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form className="roster-form" onSubmit={handleAdd}>
            <input
              className="roster-input"
              value={newName}
              placeholder={t.wheel.addPlaceholder}
              disabled={busy || spinning}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
            />
            <input
              className="roster-input roster-input--tickets"
              type="number"
              min={1}
              value={newTickets}
              placeholder={t.wheel.fieldTickets}
              aria-label={t.wheel.fieldTickets}
              disabled={busy || spinning}
              onChange={(e) => setNewTickets(e.target.value)}
            />
            <button
              type="submit"
              className="roster-add"
              disabled={busy || spinning || !newName.trim()}
            >
              {t.wheel.addName}
            </button>
          </form>
          {error ? (
            <p className="roster-error">{error}</p>
          ) : (
            <p className="roster-note">{t.wheel.rosterNote}</p>
          )}
        </div>
      )}

      {showLegend && legendOpen && (
        <WheelLegendOverlay entries={entries} onClose={() => setLegendOpen(false)} />
      )}
    </section>
  );
}
