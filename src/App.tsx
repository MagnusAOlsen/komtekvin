import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { SponsorTag } from './components/SponsorTag';
import { PaymentPage } from './pages/PaymentPage';
import { WheelPage } from './pages/WheelPage';
import { WineListPage } from './pages/WineListPage';
import { StatsPage } from './pages/StatsPage';
import { PlayerWinesPage } from './pages/PlayerWinesPage';
import { AdminUnlock } from './components/AdminUnlock';
import { useStrings } from './i18n';
import { IMG } from './images';

export type Page = 'payment' | 'wheel' | 'wines' | 'stats';

// A single player's collection is a sub-view reached from Stats; while it is
// open the bottom nav still highlights Stats.
type View = { kind: Page } | { kind: 'player'; name: string };

export function App() {
  const t = useStrings();
  // Wheel is the default page shown on load.
  const [view, setView] = useState<View>({ kind: 'wheel' });

  const activePage: Page = view.kind === 'player' ? 'stats' : view.kind;

  // Header shows the page title on Viner/Statistikk, the app name elsewhere.
  const headerTitle =
    activePage === 'wines' ? t.nav.wines : activePage === 'stats' ? t.nav.stats : t.common.appName;

  // Payment and Wheel centre their content vertically and get the flanking cats.
  const isCentered = view.kind === 'payment' || view.kind === 'wheel';
  // Only Betaling gets the pouring-wine backdrop (mobile only, see .pour-bg).
  const hasPourBackdrop = activePage === 'payment';

  return (
    <div className="app">
      {hasPourBackdrop && <img className="pour-bg" src={IMG.pouringWineGif} alt="" />}

      <header className="app-header">
        <img className="app-header-mascot" src={IMG.happyWine} alt="" />
        <span className="app-header-title">{headerTitle}</span>
        <img className="app-header-mascot" src={IMG.catCheers} alt="" />
        <div className="app-header-admin">
          <AdminUnlock />
        </div>
      </header>

      <main className="app-main">
        <div className={`page-slot${isCentered ? ' page-slot--centered' : ''}`}>
          {isCentered ? (
            // Cats flank the content and the whole row is centred horizontally.
            <div className="centered-row">
              <img className="side-cat side-cat--left" src={IMG.catWine} alt="" />
              <div className="centered-content">
                {view.kind === 'payment' && <PaymentPage />}
                {view.kind === 'wheel' && <WheelPage />}
              </div>
              <img className="side-cat side-cat--right" src={IMG.catCheers} alt="" />
            </div>
          ) : (
            <>
              {view.kind === 'wines' && <WineListPage />}
              {view.kind === 'stats' && (
                <StatsPage onViewPlayer={(name) => setView({ kind: 'player', name })} />
              )}
              {view.kind === 'player' && (
                <PlayerWinesPage name={view.name} onBack={() => setView({ kind: 'stats' })} />
              )}
            </>
          )}
        </div>

        <SponsorTag />
      </main>

      <BottomNav page={activePage} onNavigate={(page) => setView({ kind: page })} />
    </div>
  );
}
