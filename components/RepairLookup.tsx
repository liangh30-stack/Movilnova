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

        {/* ── Iniciar una reparación ── */}
        <div className="mt-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary/10 rounded-xl mb-4">
              <Wrench size={24} className="text-brand-primary" />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark tracking-tight">{t('repairStartTitle')}</h2>
            <p className="text-brand-muted mt-2 text-sm max-w-sm mx-auto">
              {t('repairStartSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                city: 'O Porriño',
                address: 'Rúa Ramón González, 54',
                phone: '+34 603 93 69 78',
                wa: 'https://wa.me/34603936978?text=Hola%2C%20quiero%20iniciar%20una%20reparaci%C3%B3n%20en%20vuestra%20tienda%20de%20O%20Porri%C3%B1o.%20%C2%BFPod%C3%A9is%20ayudarme%3F%20%F0%9F%93%B1',
              },
              {
                city: 'Baiona',
                address: 'Rúa Carabela a Pinta, 14',
                phone: '+34 623 97 93 19',
                wa: 'https://wa.me/34623979319?text=Hola%2C%20quiero%20iniciar%20una%20reparaci%C3%B3n%20en%20vuestra%20tienda%20de%20Baiona.%20%C2%BFPod%C3%A9is%20ayudarme%3F%20%F0%9F%93%B1',
              },
              {
                city: 'Lalín',
                address: 'Rúa Wenceslao Calvo Garra, 10',
                phone: '+34 611 32 12 67',
                wa: 'https://wa.me/34611321267?text=Hola%2C%20quiero%20iniciar%20una%20reparaci%C3%B3n%20en%20vuestra%20tienda%20de%20Lal%C3%ADn.%20%C2%BFPod%C3%A9is%20ayudarme%3F%20%F0%9F%93%B1',
              },
            ].map((store) => (
              <div key={store.city} className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                {/* Store info */}
                <div>
                  <h3 className="font-bold text-brand-dark text-lg">{store.city}</h3>
                  <p className="text-brand-muted text-xs mt-1">{store.address}</p>
                  <a href={`tel:${store.phone.replace(/\s/g,'')}`} className="text-xs text-brand-primary font-medium mt-0.5 inline-block hover:underline">
                    {store.phone}
                  </a>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href={store.wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('repairWhatsappCta')}
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RepairLookup;
