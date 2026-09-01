import { useEffect, useState, type DragEvent, type FormEvent } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import { addWine, updateWine, fetchPlayers } from '../api';
import type { Wine } from '../types';

/** Strips the "data:image/png;base64," prefix — the server stores raw base64. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** "2026-08-28" (the date input's format) → "28.08.2026" (the format wines.json uses). */
function isoToDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}.${month}.${year}` : '';
}

/** The inverse, for prefilling the date input when editing an existing wine. */
function displayDateToIso(display: string): string {
  const [day, month, year] = display.split('.');
  return year && month && day ? `${year}-${month}-${day}` : '';
}

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

interface WineFormProps {
  /** The wine being edited; omitted when logging a new one. */
  wine?: Wine;
  /** The player the wine is logged against. In edit mode this is only the initial value. */
  winner: string;
  onClose: () => void;
  onSaved: (wine: Wine) => void;
}

// Modal form for logging a wine, and for editing one afterwards so a description
// or photo can be filled in later. Mirrors the reference project's "add wine"
// interaction: a centred card over a backdrop, one field per property and a
// click-or-drop image picker with a live preview.
export function WineForm({ wine, winner, onClose, onSaved }: WineFormProps) {
  const t = useStrings();
  const { password } = useAdmin();
  const editing = wine !== undefined;
  const [name, setName] = useState(wine?.name ?? '');
  const [chosenWinner, setChosenWinner] = useState(wine?.winner ?? winner);
  const [year, setYear] = useState(wine?.year ? String(wine.year) : '');
  const [location, setLocation] = useState(wine?.location ?? '');
  const [date, setDate] = useState(
    wine?.date ? displayDateToIso(wine.date) || todayIso() : todayIso(),
  );
  const [price, setPrice] = useState(wine?.price ?? '');
  const [keywords, setKeywords] = useState(wine?.keywords?.join(', ') ?? '');
  const [description, setDescription] = useState(wine?.description ?? '');
  const [file, setFile] = useState<File | null>(null);
  // Seeded with the stored photo so an edit shows what is already there.
  const [preview, setPreview] = useState<string | null>(wine?.img ?? null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Only needed for the winner picker, so it is fetched only when editing.
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!editing) return;
    fetchPlayers().then((roster) => setPlayers(roster.map((player) => player.name)));
  }, [editing]);

  // Object URLs must be revoked, otherwise each pick leaks the previous blob.
  // Only blobs we created here — never the stored /uploads/ URL we started with.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith('image/')) setFile(dropped);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password || saving) return;
    setSaving(true);
    const input = {
      name: name.trim(),
      winner: chosenWinner,
      year,
      location,
      date: isoToDisplayDate(date),
      price,
      keywords,
      description,
      // Sent only when a new photo was picked; otherwise the server keeps the old one.
      ...(file
        ? { imageData: await fileToBase64(file), imageExt: file.name.split('.').pop() ?? '' }
        : {}),
    };
    const result = wine
      ? await updateWine(wine.id, input, password)
      : await addWine(input, password);
    setSaving(false);
    if (result.ok) {
      onSaved(result.wine);
    } else {
      setError(result.reason === 'too-large' ? t.wines.imageTooLarge : t.wines.saveFailed);
    }
  }

  // The current winner may have been taken off the roster, so keep them listed.
  const winnerOptions = players.includes(chosenWinner) ? players : [chosenWinner, ...players];

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="full-wine add-wine" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="full-wine-close" aria-label={t.wines.cancel} onClick={onClose}>
          ✕
        </button>
        <h2>{editing ? t.wines.editWineHeading(wine.name) : t.wines.addWineHeading(winner)}</h2>

        <input
          className="add-wine-input"
          value={name}
          required
          placeholder={t.wines.fieldName}
          aria-label={t.wines.fieldName}
          onChange={(e) => setName(e.target.value)}
        />
        {editing && (
          // A picker rather than free text: a collection is derived by matching
          // this name exactly, so a typo would orphan the bottle.
          <select
            className="add-wine-input"
            value={chosenWinner}
            aria-label={t.wines.fieldWinner}
            onChange={(e) => setChosenWinner(e.target.value)}
          >
            {winnerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
        <div className="add-wine-row">
          <input
            className="add-wine-input"
            type="number"
            value={year}
            placeholder={t.wines.fieldYear}
            aria-label={t.wines.fieldYear}
            onChange={(e) => setYear(e.target.value)}
          />
          <input
            className="add-wine-input"
            type="date"
            value={date}
            aria-label={t.wines.fieldDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="add-wine-row">
          <input
            className="add-wine-input"
            value={location}
            placeholder={t.wines.fieldLocation}
            aria-label={t.wines.fieldLocation}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            className="add-wine-input"
            value={price}
            placeholder={t.wines.fieldPrice}
            aria-label={t.wines.fieldPrice}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <input
          className="add-wine-input"
          value={keywords}
          placeholder={t.wines.fieldKeywords}
          aria-label={t.wines.fieldKeywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <textarea
          className="add-wine-input"
          value={description}
          rows={3}
          placeholder={t.wines.fieldDescription}
          aria-label={t.wines.fieldDescription}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label
          className={`add-wine-file${dragOver ? ' add-wine-file--drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <>
              <img className="add-wine-preview" src={preview} alt="" />
              <span className="add-wine-file-name">{file?.name ?? t.wines.imageChange}</span>
            </>
          ) : (
            <span className="add-wine-file-hint">{t.wines.imageHint}</span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? (
          <p className="add-wine-error">{error}</p>
        ) : (
          <p className="add-wine-note">
            {editing ? t.wines.editWineNote : t.wines.addWineNote(winner)}
          </p>
        )}

        <div className="add-wine-actions">
          <button type="button" className="add-wine-cancel" onClick={onClose}>
            {t.wines.cancel}
          </button>
          <button type="submit" className="add-wine-save" disabled={saving || !name.trim()}>
            {saving ? t.wines.saving : t.wines.save}
          </button>
        </div>
      </form>
    </div>
  );
}
