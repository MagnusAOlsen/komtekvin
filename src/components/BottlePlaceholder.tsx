// Neutral bottle silhouette in the brand red, used for wine entries that don't
// have a real photo yet. Swapped for actual bottle images later.
export function BottlePlaceholder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 200"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        fill="#9c0909"
        d="M52 6h16v28c0 6 2 9 6 14 8 11 12 20 12 34v96a12 12 0 0 1-12 12H46a12 12 0 0 1-12-12V82c0-14 4-23 12-34 4-5 6-8 6-14V6z"
      />
      <rect x="50" y="0" width="20" height="10" rx="2" fill="#6e0606" />
      <rect x="40" y="120" width="40" height="34" rx="3" fill="#fff" opacity="0.85" />
    </svg>
  );
}
