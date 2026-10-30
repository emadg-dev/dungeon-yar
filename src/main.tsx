import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// In development, clear any legacy service worker that might have been registered
// with autoUpdate and causing sudden reloads.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const r of registrations) {
      r.unregister().catch(() => {});
    }
  }).catch(() => {});
}

import { PWARefreshPrompt } from './components/mobile/PWARefreshPrompt';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
    <PWARefreshPrompt />
  </ErrorBoundary>
);
