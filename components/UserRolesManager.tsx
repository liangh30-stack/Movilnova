import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppUser } from '../services/authService';
import { logAuditEvent } from '../services/auditService';
import {
  UserCog,
  Search,
  Loader2,
  RefreshCw,
  Users,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface UserRolesManagerProps {
  user: AppUser;
}

interface UserRecord {
  uid: string;
  email?: string;
  role: 'admin' | 'customer' | 'superadmin';
  createdAt?: string;
}

const ROLE_OPTIONS: UserRecord['role'][] = ['customer', 'admin', 'superadmin'];

const ROLE_STYLES: Record<string, { bg: string; text: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  customer: { bg: 'bg-brand-light', text: 'text-brand-dark', icon: Users },
  admin: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: Shield },
  superadmin: { bg: 'bg-purple-50', text: 'text-purple-700 dark:text-purple-400', icon: ShieldCheck },
};

const UserRolesManager: React.FC<UserRolesManagerProps> = ({ user }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const records: UserRecord[] = snap.docs.map(d => ({
        uid: d.id,
        email: d.data().email ?? d.data().displayName ?? d.id,
        role: d.data().role ?? 'customer',
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? d.data().createdAt ?? undefined,
      }));
      setUsers(records.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '')));
    } catch {
      setStatus({ type: 'error', message: t('userRolesChangeError') });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter(u => u.email?.toLowerCase().includes(s) || u.uid.toLowerCase().includes(s));
  }, [users, search]);

  const kpis = useMemo(() => ({
    total: users.length,
    superadmins: users.filter(u => u.role === 'superadmin').length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer').length,
  }), [users]);

  const handleChangeRole = async (targetUser: UserRecord, newRole: UserRecord['role']) => {
    if (targetUser.role === newRole) return;

    if (targetUser.uid === user.uid) {
      if (!window.confirm(t('userRolesSelfWarning'))) return;
    }

    setChangingRole(targetUser.uid);
    setStatus(null);
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), { role: newRole });
      logAuditEvent('user.roleChange', user.uid, user.email ?? '', targetUser.uid, targetUser.email, {
        previousRole: targetUser.role,
        newRole,
      });
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRole } : u));
      setStatus({ type: 'success', message: t('userRolesChangeSuccess') });
    } catch {
      setStatus({ type: 'error', message: t('userRolesChangeError') });
    } finally {
      setChangingRole(null);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-brand-text-tertiary">{t('userRolesLoading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">{t('userRolesTitle')}</h2>
          <p className="text-sm text-brand-text-tertiary mt-0.5">{t('userRolesSubtitle')}</p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-brand-muted bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-light transition-colors"
        >
          <RefreshCw size={14} />
          {t('userRolesRefresh')}
        </button>
      </div>

      {/* Status message */}
      {status && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
          {status.type === 'success' ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />}
          <p className={`text-sm ${status.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{status.message}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('userRolesTotal'), value: kpis.total, icon: Users, color: 'text-brand-muted', bg: 'bg-brand-light' },
          { label: t('userRolesSuperadmins'), value: kpis.superadmins, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: t('userRolesAdmins'), value: kpis.admins, icon: Shield, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: t('userRolesCustomers'), value: kpis.customers, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <p className="text-2xl font-bold text-brand-dark">{kpi.value}</p>
            <p className="text-xs font-medium text-brand-text-tertiary uppercase tracking-wide mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('userRolesSearch')}
          className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-light border-b border-brand-border">
                <th className="text-left px-5 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wider">{t('userRolesColumnEmail')}</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wider">{t('userRolesColumnRole')}</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wider">{t('userRolesColumnActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-subtle">
              {filteredUsers.map(u => {
                const style = ROLE_STYLES[u.role] || ROLE_STYLES.customer;
                const RoleIcon = style.icon;
                const isSelf = u.uid === user.uid;
                return (
                  <tr key={u.uid} className={`hover:bg-brand-light/50 transition-colors ${isSelf ? 'bg-brand-primary/[0.02]' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-muted text-xs font-bold flex-shrink-0">
                          {(u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-brand-dark truncate">{u.email}</p>
                          {isSelf && <p className="text-[10px] text-brand-primary font-semibold">{t('userRolesSelfLabel', 'You')}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${style.bg} ${style.text}`}>
                        <RoleIcon size={12} />
                        {t(`userRolesRole${u.role.charAt(0).toUpperCase() + u.role.slice(1)}` as string)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {changingRole === u.uid ? (
                        <Loader2 size={16} className="animate-spin text-brand-text-tertiary" />
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleChangeRole(u, e.target.value as UserRecord['role'])}
                          className="px-3 py-1.5 border border-brand-border rounded-lg text-xs bg-brand-surface focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none cursor-pointer"
                        >
                          {ROLE_OPTIONS.map(role => (
                            <option key={role} value={role}>
                              {t(`userRolesRole${role.charAt(0).toUpperCase() + role.slice(1)}` as string)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <UserCog size={32} className="text-brand-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-brand-text-tertiary">{t('noResultsFound', 'No results found')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRolesManager;
