import { useStrings } from '../i18n';
import { IMG } from '../images';
import { SPONSOR_URL } from '../config/sponsor';

// Discreet sponsor flourish: the aces graphic + "sponset av maggiepoker.com".
// The whole thing links out to maggiepoker.com (new tab).
export function SponsorTag() {
  const t = useStrings();
  return (
    <span>
      <a
        className="sponsor-tag"
        href={SPONSOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t.sponsor.prefix} ${t.sponsor.brand}`}
      >
        <img className="sponsor-image" src={IMG.aces} alt="" />
        <span className="sponsor-text">
          {t.sponsor.prefix} <span className="sponsor-brand">{t.sponsor.brand}</span>
        </span>
      </a>
      <a
        className="sponsor-tag"
        href={"https://komtekle.netlify.app/"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Komtekle"
      >
        <img className="sponsor-image" src={IMG.komtekle} alt="" />
        <span className="sponsor-text">
          {t.sponsor.prefix} <span className="sponsor-brand">Komtekle</span>
        </span>
      </a>
    </span>
  );
}
