import { useStrings } from '../i18n';

interface PlayerStatsChartProps {
  ticketsBought: number;
  timesWon: number;
}

// The two Statistikk numbers for one player, drawn as a pair of bars plus the
// wins-per-lodd share. Plain elements rather than SVG: the bars then stretch to
// the column while the labels keep normal CSS type sizes, which an SVG viewBox
// would scale along with the width.
export function PlayerStatsChart({ ticketsBought, timesWon }: PlayerStatsChartProps) {
  const t = useStrings();

  if (ticketsBought === 0) {
    return (
      <div className="player-chart">
        <h2 className="player-chart-heading">{t.stats.chartHeading}</h2>
        <p className="empty">{t.stats.chartEmpty}</p>
      </div>
    );
  }

  // Both bars share the same scale — lodd bought is normally the longest, so
  // wins read as a visible fraction of the tickets paid for.
  const percent = Math.round((timesWon / ticketsBought) * 100);
  const bars = [
    { label: t.stats.colTickets, value: ticketsBought, modifier: 'played' },
    { label: t.stats.colWon, value: timesWon, modifier: 'won' },
  ];

  return (
    <div className="player-chart">
      <h2 className="player-chart-heading">{t.stats.chartHeading}</h2>

      <p className="player-chart-ratio">{t.stats.chartRatio(percent)}</p>
      <p className="player-chart-caption">{t.stats.chartCaption(timesWon, ticketsBought)}</p>

      <div className="player-chart-bars">
        {bars.map((bar) => (
          <div className="player-chart-row" key={bar.label}>
            <div className="player-chart-label">
              <span>{bar.label}</span>
              <span className="num">{bar.value}</span>
            </div>
            {/* Zero would draw nothing at all, so keep a sliver of the track —
                and since a corrected lodd count can end up below the wins, cap
                the other end at a full track too. */}
            <div className="player-chart-track">
              <div
                className={`player-chart-bar player-chart-bar--${bar.modifier}`}
                style={{
                  width: `${Math.min(Math.max((bar.value / ticketsBought) * 100, 2), 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
