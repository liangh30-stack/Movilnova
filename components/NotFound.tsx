import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onBack?: () => void;
  title?: string;
  message?: string;
}

const NotFound: React.FC<NotFoundProps> = ({
  onBack,
  title,
  message,
}) => {
  const { t } = useTranslation();

  const displayTitle = title || t('notFoundTitle');
  const displayMessage = message || t('notFoundMessage');

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-black text-brand-border mb-4">404</div>
        <h1 className="text-2xl font-bold text-brand-dark mb-2">{displayTitle}</h1>
        <p className="text-brand-muted mb-8">{displayMessage}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            {t('notFoundGoHome')}
          </button>
        )}
        {!onBack && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-medium rounded-lg transition-colors"
          >
            <Home size={20} />
            {t('notFoundGoHome')}
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
