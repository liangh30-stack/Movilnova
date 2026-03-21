import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    // Silently skip — no console output to avoid info leakage in production
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Environment
    environment: import.meta.env.MODE,
    // Only enable in production by default
    enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'true',
  });
};

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, { extra: context });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; email?: string; username?: string } | null) => {
  // Strip PII — only send anonymized ID to Sentry, never email
  Sentry.setUser(user ? { id: user.id } : null);
};

export const showReportDialog = (options?: Sentry.ReportDialogOptions) => {
  Sentry.showReportDialog(options);
};
