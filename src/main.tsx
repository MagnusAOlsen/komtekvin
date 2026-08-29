import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { AdminProvider } from './admin';
import { App } from './App';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <I18nProvider>
      <AdminProvider>
        <App />
      </AdminProvider>
    </I18nProvider>
  </StrictMode>,
);
