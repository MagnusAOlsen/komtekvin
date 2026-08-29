import { useState, type FormEvent } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';

// Small header control to enter ADMIN mode by typing the password.
// While admin is active it just shows a status dot; exiting is done by clicking
// the ADMIN badge on the wheel page.
export function AdminUnlock() {
  const t = useStrings();
  const { isAdmin, login } = useAdmin();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  if (isAdmin) {
    return <span className="admin-status" title={t.admin.badge}>🔓</span>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(value);
    if (ok) {
      setOpen(false);
      setValue('');
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!open) {
    // Rendered fully transparent by .admin-lock (no glyph, no tooltip, no hover
    // hint) so the way into admin mode stays hidden; it is still a real button.
    return (
      <button
        type="button"
        className="admin-lock"
        aria-label={t.admin.unlock}
        onClick={() => setOpen(true)}
      >
        🔒
      </button>
    );
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <input
        type="password"
        className={`admin-input${error ? ' admin-input--error' : ''}`}
        placeholder={error ? t.admin.wrongPassword : t.admin.passwordPlaceholder}
        value={value}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        onBlur={() => {
          if (!value) setOpen(false);
        }}
      />
      <button type="submit" className="admin-submit">
        {t.admin.submit}
      </button>
    </form>
  );
}
