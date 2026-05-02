import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { initSentry, captureException } from './services/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';

// Styles (Tailwind + custom theme)
import './app.css';

// Initialize i18n (lazy-loads non-default locales)
import { i18nReady } from './i18n';

// Validate required env vars before anything else
const requiredEnvVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID'] as const;
for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Check your .env.local file.`);
  }
}

// Initialize Sentry before rendering
initSentry();

// Global handler for unhandled promise rejections.
// (Use the static import from above — no need for a dynamic import per event.)
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  captureException(error, { source: 'unhandledrejection' });
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Wait for i18n locale to load before first render (avoids flash of wrong language)
i18nReady.then(() => {
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );
});
