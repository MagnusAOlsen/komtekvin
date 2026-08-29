import { useEffect, useState, type DragEvent, type FormEvent } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import { addWine } from '../api';
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

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

interface AddWineFormProps {
  /** The player the wine is logged against — fixed, since this opens from their page. */
  winner: string;
  onClose: () => void;
  onSaved: (wine: Wine) => void;
}

// Modal form for logging a wine, mirroring the reference project's "add wine"
// interaction: a centred card over a backdrop, one field per property and a
// click-or-drop image picker with a live preview.
export function AddWineForm({ winner, onClose, onSaved }: AddWineFormProps) {
  const t = useStrings();
  const { password } = useAdmin();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(todayIso());
  const [price, setPrice] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Object URLs must be revoked, otherwise each pick leaks the previous blob.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
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
    const result = await addWine(
      {
        name: name.trim(),
        winner,
        year,
        location,
        date: isoToDisplayDate(date),
        price,
        keywords,
        description,
        ...(file
          ? { imageData: await fileToBase64(file), imageExt: file.name.split('.').pop() ?? '' }
          : {}),
      },
      password,
    );
    setSaving(false);
    if (result.ok) {
      onSaved(result.wine);
    } else {
      setError(result.reason === 'too-large' ? t.wines.imageTooLarge : t.wines.saveFailed);
    }
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="full-wine add-wine" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="full-wine-close" aria-label={t.wines.cancel} onClick={onClose}>
          ✕
        </button>
        <h2>{t.wines.addWineHeading(winner)}</h2>

        <input
          className="add-wine-input"
          value={name}
          required
          placeholder={t.wines.fieldName}
          aria-label={t.wines.fieldName}
          onChange={(e) => setName(e.target.value)}
        />
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
              <span className="add-wine-file-name">{file?.name}</span>
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
          <p className="add-wine-note">{t.wines.addWineNote(winner)}</p>
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
