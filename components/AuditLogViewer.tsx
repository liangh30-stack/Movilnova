import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentSnapshot } from 'firebase/firestore';
import { AppUser } from '../services/authService';
import { AuditLogEntry, AuditAction } from '../types';
import { getAuditLogs, AuditLogFilters } from '../services/auditService';
import {
  ClipboardList,
  Loader2,
  RefreshCw,
  Package,
  ShoppingCart,
  Tag,
  Megaphone,
  Settings,
  UserCog,
  ChevronDown,
  X,
} from 'lucide-react';

interface AuditLogViewerProps {
  user: AppUser;
}

const ACTION_LABEL_KEYS: Record<AuditAction, string> = {
  'product.create': 'auditActionProductCreate',
  'product.update': 'auditActionProductUpdate',
  'product.delete': 'auditActionProductDelete',
  'product.import': 'auditActionProductImport',
  'order.statusChange': 'auditActionOrderStatusChange',
  'order.take': 'auditActionOrderTake',
  'order.release': 'auditActionOrderRelease',
  'promo.create': 'auditActionPromoCreate',
  'promo.update': 'auditActionPromoUpdate',
  'promo.delete': 'auditActionPromoDelete',
  'offer.create': 'auditActionOfferCreate',
  'offer.update': 'auditActionOfferUpdate',
  'offer.delete': 'auditActionOfferDelete',
  'settings.update': 'auditActionSettingsUpdate',
  'user.roleChange': 'auditActionUserRoleChange',
};

const DOMAIN_META: Record<string, {
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  labelKey: string;
}> = {
  product: { icon: Package, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', labelKey: 'auditDomainProduct' },
  order: { icon: ShoppingCart, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', labelKey: 'auditDomainOrder' },
  promo: { icon: Tag, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', labelKey: 'auditDomainPromo' },
  offer: { icon: Megaphone, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', labelKey: 'auditDomainOffer' },
  settings: { icon: Settings, color: 'text-brand-dark', bg: 'bg-brand-light', labelKey: 'auditDomainSettings' },
  user: { icon: UserCog, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', labelKey: 'auditDomainUser' },
};

const ALL_ACTIONS: AuditAction[] = [
  'product.create', 'product.update', 'product.delete', 'product.import',
  'order.statusChange', 'order.take', 'order.release',
  'promo.create', 'promo.update', 'promo.delete',
  'offer.create', 'offer.update', 'offer.delete',
  'settings.update',
  'user.roleChange',
];

const PAGE_SIZE = 50;

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ user: _user }) => {
  const { t, i18n } = useTranslation();

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const buildFilters = useCallback((): AuditLogFilters => {
    const f: AuditLogFilters = {};
    if (actionFilter) f.action = actionFilter;
    if (userFilter.trim()) f.userEmail = userFilter.trim();
    if (startDate) f.startDate = new Date(startDate + 'T00:00:00');
    if (endDate) f.endDate = new Date(endDate + 'T23:59:59');
    return f;
  }, [actionFilter, userFilter, startDate, endDate]);

  const fetchLogs = useCallback(async (reset = true) => {
    if (reset) {
      setIsLoading(true);
      setLastDoc(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await getAuditLogs(
        buildFilters(),
        PAGE_SIZE,
        reset ? undefined : lastDoc ?? undefined,
      );

      if (reset) {
        setEntries(result.entries);
      } else {
        setEntries(prev => [...prev, ...result.entries]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.entries.length === PAGE_SIZE);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error loading audit logs:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [buildFilters, lastDoc]);

  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => fetchLogs(true);

  const handleResetFilters = () => {
    setActionFilter('');
    setUserFilter('');
    setStartDate('');
    setEndDate('');
    // Will fetch after state update via explicit call
    setTimeout(() => fetchLogs(true), 0);
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDomain = (action: AuditAction) => action.split('.')[0];

  const renderActionBadge = (action: AuditAction) => {
    const domain = getDomain(action);
    const meta = DOMAIN_META[domain];
    if (!meta) return <span className="text-xs">{action}</span>;
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.color}`}>
        <Icon size={12} />
        {t(ACTION_LABEL_KEYS[action] || action)}
      </span>
    );
  };

  const renderDetails = (entry: AuditLogEntry) => {
    const parts: string[] = [];

    // Extract known detail fields
    if (entry.details) {
      if (entry.details.previousStatus && entry.details.newStatus) {
        parts.push(`${entry.details.previousStatus} → ${entry.details.newStatus}`);
      }
      if (entry.details.previousRole && entry.details.newRole) {
        parts.push(`${entry.details.previousRole} → ${entry.details.newRole}`);
      }
      if (entry.details.count != null) {
        parts.push(`${t('auditDetailCount')}: ${entry.details.count}`);
      }
      if (entry.details.fields) {
        const fields = entry.details.fields as string[];
        parts.push(fields.join(', '));
      }
    }

    // Fallback: show action-based description
    if (parts.length === 0) {
      const verb = entry.action.split('.')[1];
      const domain = getDomain(entry.action);
      const domainLabel = t(DOMAIN_META[domain]?.labelKey || domain);
      const actionVerb = verb === 'create' ? t('auditVerbCreated')
        : verb === 'update' ? t('auditVerbUpdated')
        : verb === 'delete' ? t('auditVerbDeleted')
        : verb === 'import' ? t('auditVerbImported')
        : verb === 'statusChange' ? t('auditVerbStatusChanged')
        : verb === 'roleChange' ? t('auditVerbRoleChanged')
        : verb;

      if (entry.targetName) {
        parts.push(`${domainLabel} "${entry.targetName}" ${actionVerb}`);
      } else {
        parts.push(`${domainLabel} ${actionVerb}`);
      }
    }

    return parts.join(' · ');
  };

  const hasActiveFilters = actionFilter || userFilter || startDate || endDate;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2.5">
            <ClipboardList size={22} className="text-brand-primary" />
            {t('auditTitle')}
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">{t('auditSubtitle')}</p>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm font-medium text-brand-dark hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {t('auditRefresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Action filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider mb-1">
              {t('auditFilterAction')}
            </label>
            <div className="relative">
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value as AuditAction | '')}
                className="w-full appearance-none border border-brand-border rounded-lg px-3 py-2 pr-8 text-sm bg-brand-surface focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              >
                <option value="">{t('auditFilterAll')}</option>
                {ALL_ACTIONS.map(a => (
                  <option key={a} value={a}>{t(ACTION_LABEL_KEYS[a])}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-tertiary pointer-events-none" />
            </div>
          </div>

          {/* User filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider mb-1">
              {t('auditFilterUser')}
            </label>
            <input
              type="text"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              placeholder="admin@example.com"
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          {/* Date range */}
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider mb-1">
              {t('auditFilterStartDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider mb-1">
              {t('auditFilterEndDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          {/* Buttons */}
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors"
          >
            {t('auditFilterApply')}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-brand-muted hover:text-brand-dark text-sm font-medium flex items-center gap-1"
            >
              <X size={14} />
              {t('auditFilterReset')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-brand-primary mr-2" />
            <span className="text-sm text-brand-muted">{t('auditLoading')}</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-brand-text-tertiary">
            <ClipboardList size={40} className="mb-3" />
            <p className="text-sm font-medium">{hasActiveFilters ? t('auditNoFilterResults') : t('auditNoResults')}</p>
            <p className="text-xs mt-1">{hasActiveFilters ? '' : t('auditNoResultsHint')}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border-subtle bg-brand-light/50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider">{t('auditColumnTime')}</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider">{t('auditColumnUser')}</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider">{t('auditColumnAction')}</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider">{t('auditColumnTarget')}</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-text-tertiary uppercase tracking-wider">{t('auditColumnDetails')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b border-brand-border-subtle hover:bg-brand-light/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-brand-muted whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-[10px] font-bold flex-shrink-0">
                            {(entry.userEmail || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-brand-dark truncate max-w-[160px]">{entry.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderActionBadge(entry.action)}</td>
                      <td className="px-4 py-3 text-xs text-brand-muted max-w-[200px]">
                        <span className="line-clamp-2">{entry.targetName || entry.targetId || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted max-w-[250px]">
                        <span className="line-clamp-2">{renderDetails(entry)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-brand-border-subtle">
              {entries.map(entry => (
                <div key={entry.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    {renderActionBadge(entry.action)}
                    <span className="text-[10px] text-brand-text-tertiary">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-[9px] font-bold flex-shrink-0">
                      {(entry.userEmail || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-brand-muted truncate">{entry.userEmail}</span>
                  </div>
                  {(entry.targetName || entry.targetId) && (
                    <p className="text-xs text-brand-muted">
                      <span className="font-medium">{t('auditColumnTarget')}:</span> {entry.targetName || entry.targetId}
                    </p>
                  )}
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <p className="text-[11px] text-brand-text-tertiary">{renderDetails(entry)}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-brand-border-subtle">
                <button
                  onClick={() => fetchLogs(false)}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-light hover:bg-brand-border rounded-lg text-sm font-medium text-brand-dark transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t('auditLoadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
