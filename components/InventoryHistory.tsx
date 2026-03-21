import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InventoryChange } from '../types';
import { getProductInventoryHistory } from '../services/inventoryService';
import { X, Package, TrendingUp, TrendingDown, RefreshCw, ShoppingCart, Loader2 } from 'lucide-react';

interface InventoryHistoryProps {
  productId: string | number;
  productName: string;
  onClose: () => void;
}

const InventoryHistory: React.FC<InventoryHistoryProps> = ({ productId, productName, onClose }) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<InventoryChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProductInventoryHistory(productId, 50);
        setHistory(data);
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error loading inventory history:', err);
        setError(t('inventoryHistoryLoadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [productId]);

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'sale':
        return <ShoppingCart size={16} className="text-brand-primary" />;
      case 'restock':
        return <Package size={16} className="text-green-600 dark:text-green-400" />;
      case 'adjustment':
        return <RefreshCw size={16} className="text-orange-500" />;
      case 'manual':
        return <RefreshCw size={16} className="text-blue-500" />;
      default:
        return <Package size={16} className="text-brand-muted" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'sale':
        return t('inventoryReasonSale');
      case 'restock':
        return t('inventoryReasonRestock');
      case 'adjustment':
        return t('inventoryReasonAdjustment');
      case 'manual':
        return t('inventoryReasonManual');
      default:
        return reason;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-brand-muted';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} />;
    if (change < 0) return <TrendingDown size={16} />;
    return null;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] bg-brand-surface z-[90] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-label={t('inventoryHistoryTitle')}
      >
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex justify-between items-start bg-brand-light rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
              <Package size={24} className="text-brand-primary" />
              {t('inventoryHistoryTitle')}
            </h3>
            <p className="text-sm text-brand-muted mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-border rounded-lg transition-colors"
            aria-label={t('inventoryHistoryClose')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-brand-critical font-semibold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
              >
                {t('inventoryHistoryRetry')}
              </button>
            </div>
          )}

          {!isLoading && !error && history.length === 0 && (
            <div className="text-center py-20 text-brand-muted">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">{t('inventoryHistoryEmpty')}</p>
              <p className="text-sm mt-2">{t('inventoryHistoryEmptyHint')}</p>
            </div>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className="space-y-3">
              {history.map((change) => (
                <div
                  key={change.id}
                  className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        {getReasonIcon(change.reason)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-brand-dark">
                            {getReasonLabel(change.reason)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-brand-light rounded-md text-brand-muted font-semibold">
                            {formatDate(change.timestamp)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-brand-muted">{t('inventoryHistoryPrevious')}:</span>
                            <span className="ml-1 font-bold text-brand-dark">{change.previousStock}</span>
                          </div>
                          <div className={`flex items-center gap-1 font-bold ${getChangeColor(change.change)}`}>
                            {getChangeIcon(change.change)}
                            <span>{change.change > 0 ? '+' : ''}{change.change}</span>
                          </div>
                          <div>
                            <span className="text-brand-muted">{t('inventoryHistoryNew')}:</span>
                            <span className="ml-1 font-bold text-brand-dark">{change.newStock}</span>
                          </div>
                        </div>

                        {change.userEmail && (
                          <div className="mt-2 text-xs text-brand-muted">
                            <span className="font-semibold">{t('inventoryHistoryBy')}:</span> {change.userEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border bg-brand-light rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-brand-emphasis text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
          >
            {t('inventoryHistoryClose')}
          </button>
        </div>
      </div>
    </>
  );
};

export default InventoryHistory;
