import { useEffect, useState, type FormEvent } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import { Wheel } from '../components/Wheel';
import { fetchWheelNames, recordSpin, addWheelName, removeWheelName } from '../api';
import { IMG } from '../images';

// Middle page (default) — the spinning wheel that draws a winner.
// In ADMIN mode the participant list below the wheel is editable: adding a name
// also creates their stats row, while removing one only takes them off the
// wheel — the stats table keeps the person and their counters.
export function WheelPage() {
  const t = useStrings();
  const { isAdmin, password, logout } = useAdmin();
  const [names, setNames] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchWheelNames().then(setNames);
  }, []);

  function handleWinner(name: string) {
    setWinner(name);
    setSpinning(false);
    // The stats table is only updated in ADMIN mode.
    if (isAdmin && password) {
      void recordSpin(name, names, password);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !password || busy) return;
    setBusy(true);
    const result = await addWheelName(name, password);
    setBusy(false);
    if (result.ok) {
      setNames(result.names);
      setNewName('');
      setError(null);
    } else {
      setError(result.reason === 'duplicate' ? t.wheel.addDuplicate : t.wheel.addFailed);
    }
  }

  async function handleRemove(name: string) {
    if (!password || busy) return;
    if (!window.confirm(t.wheel.confirmRemove(name))) return;
    setBusy(true);
    const result = await removeWheelName(name, password);
    setBusy(false);
    if (result.ok) {
      setNames(result.names);
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

      <h1>{t.wheel.heading}</h1>
      {names.length === 0 ? (
        <p className="empty">{t.wheel.empty}</p>
      ) : (
        <>
          <Wheel
            names={names}
            onWinner={handleWinner}
            onSpinStart={() => {
              setWinner(null);
              setSpinning(true);
            }}
          />
          {!isAdmin && <p className="admin-hint">{t.admin.getRights}</p>}
          {winner && (
            <>
              {/* Confetti covers the whole screen on a win. */}
              <div className="confetti-fullscreen" aria-hidden="true">
                <img src={IMG.confettiGif} alt="" />
              </div>
              <div className="winner-announcement" role="status">
                <p className="winner-label">{t.wheel.winnerLabel}</p>
                <p className="winner-name">{winner}</p>
              </div>
            </>
          )}
        </>
      )}

      {isAdmin && (
        // Editing while the wheel turns would change the segment the pointer is
        // heading for, so the whole editor is disabled during a spin.
        <div className="roster">
          <h2 className="roster-heading">{t.wheel.rosterHeading}</h2>
          <ul className="roster-chips">
            {names.map((name) => (
              <li key={name} className="roster-chip">
                <span>{name}</span>
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
    </section>
  );
}
