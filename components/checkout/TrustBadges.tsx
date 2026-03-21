import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, RotateCcw, CreditCard } from 'lucide-react';

const TrustBadges: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4">
      <div className="flex items-center gap-1.5 text-xs text-brand-muted">
        <Lock size={14} className="text-green-600 dark:text-green-400" />
        <span>{t('checkoutSecurePayment')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-brand-muted">
        <Shield size={14} className="text-blue-600 dark:text-blue-400" />
        <span>{t('checkoutDataProtected')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-brand-muted">
        <RotateCcw size={14} className="text-orange-500" />
        <span>{t('checkoutEasyReturns')}</span>
      </div>
      {/* Payment logos */}
      <div className="flex items-center gap-2 ml-2">
        <CreditCard size={16} className="text-brand-muted" />
        <span className="text-[10px] text-brand-muted font-medium">{t('checkoutPaymentMethods')}</span>
      </div>
    </div>
  );
};

export default React.memo(TrustBadges);
