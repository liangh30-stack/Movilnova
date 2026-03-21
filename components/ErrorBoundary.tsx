import React from 'react';
import * as Sentry from '@sentry/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';
import { showReportDialog, captureException } from '@/services/sentry';

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetError }) => {
  const { t } = useTranslation();
  const handleReport = () => {
    showReportDialog({
      title: t('errorReportTitle'),
      subtitle: t('errorReportSubtitle'),
      subtitle2: t('errorReportSubtitle2'),
    });
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="bg-brand-surface rounded-lg border border-brand-border shadow-lg p-8 max-w-lg text-center" role="alert">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-12 h-12 text-brand-critical" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-brand-dark mb-2">
          {t('errorTitle')}
        </h1>

        <p className="text-brand-muted text-sm mb-6">
          {t('errorMessage')}
        </p>

        {import.meta.env.DEV && (
          <div className="mb-6 bg-brand-light border border-brand-border rounded-lg p-4 text-left">
            <p className="text-xs font-mono text-brand-muted break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg font-semibold px-6 py-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('errorTryAgain')}
          </button>

          <button
            onClick={handleReport}
            className="flex items-center justify-center gap-2 bg-brand-light hover:bg-brand-border text-brand-muted rounded-lg px-6 py-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {t('errorReportIssue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error instanceof Error ? error : new Error(String(error))} resetError={resetError} />
      )}
      onError={(error, componentStack) => {
        captureException(error instanceof Error ? error : new Error(String(error)), {
          source: 'ErrorBoundary',
          componentStack: componentStack ?? undefined,
        });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default ErrorBoundary;
