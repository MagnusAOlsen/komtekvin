import { useStrings } from '../i18n';
import type { Page } from '../App';

// Persistent bottom navigation across all three pages, ordered
// Payment (left) · Wheel (middle) · Wines (right).
export function BottomNav({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const t = useStrings();
  const items: { key: Page; label: string }[] = [
    { key: 'payment', label: t.nav.payment },
    { key: 'wheel', label: t.nav.wheel },
    { key: 'wines', label: t.nav.wines },
    { key: 'stats', label: t.nav.stats },
  ];

  return (
    <nav className="bottom-nav" aria-label={t.common.appName}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`nav-item${page === item.key ? ' active' : ''}`}
          aria-current={page === item.key ? 'page' : undefined}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
