import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, CheckCircle, Clock, Smartphone,
  FileText, MessageCircle, ArrowLeft, AlertCircle,
  Wrench, Package, Truck, CircleDot, Phone, Copy, Check, Shield, User
} from 'lucide-react';
import { MOCK_REPAIRS } from '../constants';
import { RepairJob, Language } from '../types';
import { COMPANY } from '../config/company';

interface RepairLookupProps {
  onBrowseShop: () => void;
  lang: Language;
  initialSearchTerm?: string;
  onClearSearch?: () => void;
}

const RepairLookup: React.FC<RepairLookupProps> = ({ onBrowseShop, initialSearchTerm, onClearSearch }) => {
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState(initialSearchTerm || '');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<RepairJob | null | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialSearchTerm) {
      setOrderId(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    return () => {
      if (onClearSearch) onClearSearch();
    };
  }, [onClearSearch]);

  const getEnrichedData = (repair: RepairJob) => ({
    ...repair,
    imei: "356988******49",
    warranty: t('repairDefaultWarranty'),
    deposit: 20.00,
    total: repair.price || 89.00,
    technicianName: repair.technician || "Alex D.",
    storeName: `${COMPANY.brandName} ${COMPANY.city}`,
    storePhone: COMPANY.phone
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(undefined);
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const found = MOCK_REPAIRS.find(r => r.id.toLowerCase() === orderId.toLowerCase());

      if (found) {
        if (found.telefono) {
          const inputPhone = phone.replace(/\D/g, '');
          const recordPhone = found.telefono.replace(/\D/g, '');
          if (!inputPhone || !recordPhone.includes(inputPhone)) {
            setResult(null);
            setErrorMsg(t('repairPhoneMismatch'));
            setLoading(false);
            return;
          }
        }
        setResult(found);
      } else {
        setResult(null);
        setErrorMsg(t('repairNotFound'));
      }
      setLoading(false);
    }, 600);
  };

  const copyOrderId = () => {
    if (result) {
      navigator.clipboard.writeText(result.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusStep = (status: string): number => {
    const statusMap: Record<string, number> = {
      'Received': 0,
      'Diagnosing': 1,
      'Waiting for Parts': 2,
      'Repaired': 3,
      'Ready for Pickup': 4,
      'Picked Up': 5,
      'Finished': 5
    };
    return statusMap[status] ?? 0;
  };

  const steps = [
    { icon: Package, label: t('repairStepReceived') },
    { icon: Search, label: t('repairStepDiagnosis') },
    { icon: Clock, label: t('repairStepParts') },
    { icon: Wrench, label: t('repairStepRepair') },
    { icon: Truck, label: t('repairStepReady') },
  ];

  const enrichedResult = result ? getEnrichedData(result) : null;
  const currentStep = result ? getStatusStep(result.status) : 0;

  return (
    <div className="min-h-screen bg-brand-light py-12 px-4" aria-label={t('trackTitle')}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-lg mb-5 shadow-sm" aria-hidden="true">
            <Search size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-brand-dark mb-3 tracking-tight">{t('trackTitle')}</h1>
          <p className="text-brand-muted text-base max-w-md mx-auto">{t('trackDesc')}</p>
        </div>

        {/* Search Form Card */}
        <div className="bg-brand-surface rounded-lg border border-brand-border shadow-sm p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-5" aria-label={t('searchButton')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="repair-order-id" className="block text-sm font-semibold text-brand-dark mb-2">{t('orderLabel')}</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} aria-hidden="true" />
                  <input
                    id="repair-order-id"
                    type="text"
                    placeholder="WX-8888"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                    className="w-full bg-brand-input border border-brand-border rounded-lg pl-12 pr-4 py-3.5 text-brand-dark font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm"
                    required
                    aria-label={t('orderLabel')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="repair-phone" className="block text-sm font-semibold text-brand-dark mb-2">{t('phoneLabel')}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} aria-hidden="true" />
                  <input
                    id="repair-phone"
                    type="tel"
                    placeholder="600 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-brand-input border border-brand-border rounded-lg pl-12 pr-4 py-3.5 text-brand-dark font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm"
                    required
                    aria-label={t('phoneLabel')}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-sm"
              aria-label={t('searchButton')}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-label="Loading" />
              ) : (
                <>
                  <Search size={18} />
                  {t('searchButton')}
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-5 p-4 bg-red-50 dark:bg-red-900/20 text-brand-critical rounded-lg flex items-center gap-3 text-sm border border-red-100" role="alert">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <AlertCircle size={18} />
              </div>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Result */}
        {enrichedResult && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Status Card */}
            <div className="bg-brand-surface rounded-lg border border-brand-border shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="p-6 border-b border-brand-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-brand-muted uppercase tracking-wider">{t('repairOrder')}</span>
                    <button
                      onClick={copyOrderId}
                      className="flex items-center gap-2 bg-brand-light hover:bg-brand-light px-3 py-1.5 rounded-lg transition-colors border border-brand-border"
                      aria-label={`Copy order ID ${enrichedResult.id}`}
                    >
                      <span className="font-mono font-semibold text-brand-dark text-sm">{enrichedResult.id}</span>
                      {copied ? <Check size={14} className="text-brand-primary" /> : <Copy size={14} className="text-brand-muted" />}
                    </button>
                  </div>
                  <span className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
                    currentStep >= 4 ? 'bg-brand-primary-light text-brand-primary' : 'bg-brand-light text-brand-primary'
                  }`} aria-label={currentStep >= 4 ? t('repairStatusReady') : t('repairStatusProgress')}>
                    {currentStep >= 4 ? t('repairStatusReady') : t('repairStatusProgress')}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-brand-dark tracking-tight">{enrichedResult.device}</h2>
                <p className="text-brand-muted text-sm mt-1">{enrichedResult.issue}</p>
              </div>

              {/* Progress Steps */}
              <div className="p-6 bg-brand-light" aria-label="Repair progress">
                <div className="flex items-center justify-between relative">
                  {/* Progress line background */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-brand-border mx-8" aria-hidden="true" />
                  {/* Progress line filled */}
                  <div
                    className="absolute top-5 left-0 h-0.5 bg-brand-primary mx-8 transition-all duration-500"
                    style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 4rem)` }}
                    aria-hidden="true"
                  />

                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx < currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 relative z-10" aria-label={`${step.label}: ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          isCompleted ? 'bg-brand-primary text-white shadow-sm' :
                          isCurrent ? 'bg-brand-surface text-brand-primary ring-2 ring-brand-primary shadow-sm' :
                          'bg-brand-surface text-brand-muted border border-brand-border'
                        }`}>
                          {isCompleted ? <CheckCircle size={20} /> : <Icon size={18} />}
                        </div>
                        <span className={`text-[11px] mt-2.5 text-center font-medium leading-tight max-w-[60px] ${
                          isCompleted || isCurrent ? 'text-brand-dark' : 'text-brand-muted'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Details Grid - responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Device Info */}
              <div className="bg-brand-surface rounded-lg p-5 border border-brand-border shadow-sm" aria-label={t('repairDeviceInfo')}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-primary-light rounded-lg flex items-center justify-center" aria-hidden="true">
                    <Smartphone size={16} className="text-brand-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-brand-dark">{t('repairDeviceInfo')}</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">IMEI</span>
                    <span className="font-mono font-medium text-brand-dark">{enrichedResult.imei}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">{t('repairTechnician')}</span>
                    <span className="font-medium text-brand-dark flex items-center gap-1.5">
                      <User size={12} />
                      {enrichedResult.technicianName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">{t('repairWarranty')}</span>
                    <span className="font-medium text-brand-primary flex items-center gap-1.5">
                      <Shield size={12} />
                      {enrichedResult.warranty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-brand-surface rounded-lg p-5 border border-brand-border shadow-sm" aria-label={t('repairPayment')}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-primary-light rounded-lg flex items-center justify-center" aria-hidden="true">
                    <FileText size={16} className="text-brand-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-brand-dark">{t('repairPayment')}</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">{t('repairTotal')}</span>
                    <span className="font-semibold text-brand-dark">&euro;{enrichedResult.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">{t('repairDeposit')}</span>
                    <span className="font-medium text-brand-primary">-&euro;{enrichedResult.deposit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-3 border-t border-brand-border">
                    <span className="font-semibold text-brand-dark">{t('repairBalance')}</span>
                    <span className="font-bold text-brand-primary text-lg">&euro;{(enrichedResult.total - enrichedResult.deposit).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <a
                href={`https://wa.me/34986123456?text=${encodeURIComponent(t('repairWhatsappMessage', { orderId: enrichedResult.id }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2.5 text-sm shadow-sm"
                aria-label="Contact via WhatsApp"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
              <button
                onClick={onBrowseShop}
                className="flex-1 bg-brand-surface hover:bg-brand-light text-brand-dark font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2.5 text-sm border border-brand-border shadow-sm"
                aria-label={t('repairBackToShop')}
              >
                <ArrowLeft size={18} />
                {t('repairBackToShop')}
              </button>
            </div>

            {/* Store Info */}
            <div className="text-center py-4">
              <p className="text-sm text-brand-muted">
                {enrichedResult.storeName} &middot; {enrichedResult.storePhone}
              </p>
            </div>
          </div>
        )}

        {/* Empty State Hint */}
        {result === undefined && (
          <div className="text-center py-12" aria-label={t('repairHint')}>
            <div className="w-20 h-20 bg-brand-light rounded-lg flex items-center justify-center mx-auto mb-5 border border-brand-border" aria-hidden="true">
              <CircleDot size={40} className="text-brand-text-tertiary" />
            </div>
            <p className="text-brand-muted">{t('repairHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairLookup;
