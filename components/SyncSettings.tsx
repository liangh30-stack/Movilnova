import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudDownload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SyncSettingsProps {
  onSync: (url: string) => Promise<boolean>;
}

const SyncSettings: React.FC<SyncSettingsProps> = ({ onSync }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSyncClick = async () => {
    if (!url) return;
    setStatus('loading');
    const success = await onSync(url);
    if (success) {
      setStatus('success');
      setMsg(t('syncSuccess') || 'Synchronized successfully!');
    } else {
      setStatus('error');
      setMsg(t('syncError') || 'Failed to sync. Check URL.');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
        <CloudDownload size={24} className="text-brand-primary" /> {t('syncTitle') || 'Connect Inventory System'}
      </h2>

      <div className="bg-brand-primary-light border border-brand-primary/20 rounded-lg p-4 mb-6">
        <h3 className="text-brand-dark text-sm font-bold mb-2">{t('syncInstructionsTitle') || 'Instructions'}</h3>
        <ol className="list-decimal list-inside text-brand-muted text-xs space-y-2">
          <li>{t('syncStep1') || 'Open your Google Sheet (Database).'}</li>
          <li>{t('syncStep2') || 'Go to Extensions > Apps Script.'}</li>
          <li>{t('syncStep3') || 'Paste the helper script (available in documentation).'}</li>
          <li>{t('syncStep4') || 'Deploy as Web App (Execute as: Me, Access: Anyone).'}</li>
          <li>{t('syncStep5') || 'Paste the generated URL below.'}</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-brand-dark text-sm font-medium mb-1">{t('syncUrlLabel') || 'Apps Script URL'}</label>
          <input
            type="text"
            className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-brand-dark placeholder:text-brand-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            placeholder="https://script.google.com/macros/s/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            aria-label={t('syncUrlLabel') || 'Apps Script URL'}
          />
        </div>

        {status === 'error' && (
          <div role="alert" className="bg-brand-critical/10 border border-brand-critical/20 text-brand-critical p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {msg}
          </div>
        )}

        {status === 'success' && (
          <div role="alert" className="bg-brand-success/10 border border-brand-success/20 text-brand-success p-3 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle size={16} /> {msg}
          </div>
        )}

        <button
          onClick={handleSyncClick}
          disabled={status === 'loading'}
          className="w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin text-brand-primary" />
              <span>{t('syncLoading') || 'Syncing...'}</span>
            </>
          ) : (
            <span>{t('syncButton') || 'Connect & Sync'}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SyncSettings;
