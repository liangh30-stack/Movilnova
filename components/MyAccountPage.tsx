import React, { useState, useRef, useEffect } from 'react';
import {
  User, ShoppingBag, MapPin, Heart, ArrowLeft, LogOut,
  Edit3, Trash2, Star, Plus, ShoppingCart, Package,
  CheckCircle, ChevronDown, ChevronUp, Loader2, Clock,
  CreditCard, Truck, XCircle, Phone, Mail, ChevronRight, Lock,
  AlertTriangle, ShieldX, Undo2, Ban, Bell
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Customer, CustomerAddress, CustomerOrder, Product } from '../types';
import {
  changeCustomerPassword,
  reauthenticateCustomer,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '../services/customerService';
import { requestPushPermission, disablePush } from '../services/pushNotifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AccountTab = 'profile' | 'orders' | 'addresses' | 'favorites';

interface MyAccountPageProps {
  customer: Customer;
  onLogout: () => void;
  onBack: () => void;
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
  favorites: Set<string | number>;
  products: Product[];
  onUpdateProfile: (data: Partial<Customer>) => Promise<void>;
  onAddAddress: (address: Omit<CustomerAddress, 'id'>) => Promise<void>;
  onUpdateAddress: (id: string, data: Partial<CustomerAddress>) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  onSetDefaultAddress: (id: string) => Promise<void>;
  onToggleFavorite: (productId: string | number) => void;
  onAddToCart: (product: Product) => void;
  onDeletionStatusChange?: (deletionRequestedAt: string | undefined) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORDER_STATUS_CONFIG: Record<string, { key: string; color: string; bg: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  Pending:    { key: 'orderStatusPending',    color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',   icon: Clock },
  Processing: { key: 'orderStatusProcessing', color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',     icon: Loader2 },
  Paid:       { key: 'orderStatusPaid',       color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: CreditCard },
  Shipped:    { key: 'orderStatusShipped',    color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200',  icon: Truck },
  Delivered:  { key: 'orderStatusDelivered',  color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',    icon: Package },
  Cancelled:  { key: 'orderStatusCancelled',  color: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',        icon: XCircle },
};

const emptyAddress: Omit<CustomerAddress, 'id'> = {
  label: '', fullName: '', street: '', city: '', postalCode: '', country: '', phone: '', isDefault: false,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MyAccountPage: React.FC<MyAccountPageProps> = ({
  customer, onLogout, onBack, orders, addresses, favorites, products,
  onUpdateProfile, onAddAddress, onUpdateAddress, onDeleteAddress,
  onSetDefaultAddress, onToggleFavorite, onAddToCart, onDeletionStatusChange,
}) => {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: customer.displayName, phone: customer.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressSaving, setAddressSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Push notifications
  const [pushEnabled, setPushEnabled] = useState(!!customer.fcmToken);
  const [pushLoading, setPushLoading] = useState(false);

  // Account deletion
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  const initials = customer.displayName.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  const favoritedProducts = products.filter(p => favorites.has(p.id));

  const tabs: { id: AccountTab; label: string; icon: React.FC<{ size?: number }>; count?: number }[] = [
    { id: 'orders', label: t('customerOrders', 'Pedidos'), icon: ShoppingBag, count: orders.length },
    { id: 'addresses', label: t('customerAddresses', 'Direcciones'), icon: MapPin, count: addresses.length },
    { id: 'favorites', label: t('customerFavorites', 'Favoritos'), icon: Heart, count: favoritedProducts.length },
    { id: 'profile', label: t('customerProfile', 'Perfil'), icon: User },
  ];

  // Handlers
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      await onUpdateProfile({ displayName: profileForm.displayName, phone: profileForm.phone || undefined });
      setProfileSuccess(true);
      setEditingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } finally {
      setProfileSaving(false);
    }
  };

  const openNewAddressForm = () => { setAddressForm(emptyAddress); setEditingAddressId(null); setShowAddressForm(true); };
  const openEditAddressForm = (addr: CustomerAddress) => {
    setAddressForm({ label: addr.label, fullName: addr.fullName, street: addr.street, city: addr.city, postalCode: addr.postalCode, country: addr.country, phone: addr.phone, isDefault: addr.isDefault });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    setAddressSaving(true);
    try {
      if (editingAddressId) { await onUpdateAddress(editingAddressId, addressForm); }
      else { await onAddAddress(addressForm); }
      setShowAddressForm(false); setEditingAddressId(null); setAddressForm(emptyAddress);
    } finally { setAddressSaving(false); }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = (a as any).createdAt || (a as any).date || '';
    const dateB = (b as any).createdAt || (b as any).date || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // -----------------------------------------------------------------------
  // Shared input class
  // -----------------------------------------------------------------------
  const inputClass = 'w-full border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-dark bg-brand-surface placeholder:text-brand-text-tertiary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all';

  // -----------------------------------------------------------------------
  // Render: Profile
  // -----------------------------------------------------------------------
  const renderProfile = () => (
    <div className="space-y-5">
      {profileSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-200">
          <CheckCircle size={16} />
          {t('customerProfileUpdated', 'Perfil actualizado correctamente')}
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-6 border-b border-brand-border-subtle flex items-center justify-between">
          <h3 className="font-semibold text-brand-dark">{t('customerProfile', 'Información personal')}</h3>
          {!editingProfile && (
            <button onClick={() => setEditingProfile(true)} className="text-sm font-medium text-brand-primary hover:text-brand-primary-dark flex items-center gap-1.5 transition-colors">
              <Edit3 size={14} />
              {t('customerEditProfile', 'Editar')}
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerFullName', 'Nombre completo')}</label>
              <input type="text" value={profileForm.displayName} onChange={e => setProfileForm(f => ({ ...f, displayName: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerEmail', 'Email')}</label>
              <input type="email" value={customer.email} disabled className={`${inputClass} !bg-brand-input !text-brand-text-tertiary cursor-not-allowed`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerPhone', 'Teléfono')}</label>
              <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+34 612 345 678" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveProfile} disabled={profileSaving} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition-colors">
                {profileSaving && <Loader2 size={14} className="animate-spin" />}
                {t('customerSaveProfile', 'Guardar')}
              </button>
              <button onClick={() => { setEditingProfile(false); setProfileForm({ displayName: customer.displayName, phone: customer.phone || '' }); }} className="text-brand-muted hover:text-brand-dark px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                {t('formCancel', 'Cancelar')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-brand-muted" />
                </div>
                <div>
                  <span className="text-xs text-brand-text-tertiary font-medium">{t('customerFullName', 'Nombre')}</span>
                  <p className="text-sm text-brand-dark font-medium">{customer.displayName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-brand-muted" />
                </div>
                <div>
                  <span className="text-xs text-brand-text-tertiary font-medium">{t('customerEmail', 'Email')}</span>
                  <p className="text-sm text-brand-dark font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-brand-muted" />
                </div>
                <div>
                  <span className="text-xs text-brand-text-tertiary font-medium">{t('customerPhone', 'Teléfono')}</span>
                  <p className="text-sm text-brand-dark font-medium">{customer.phone || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-6 border-b border-brand-border-subtle flex items-center gap-2">
          <Lock size={16} className="text-brand-muted" />
          <h3 className="font-semibold text-brand-dark">{t('accountChangePassword', 'Cambiar contraseña')}</h3>
        </div>
        <div className="p-6 space-y-4">
          {passwordMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${passwordMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
              {passwordMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {passwordMsg.text}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('accountCurrentPassword', 'Contraseña actual')}</label>
            <input type="password" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('accountNewPassword', 'Nueva contraseña')}</label>
            <input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(f => ({ ...f, newPass: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('accountConfirmPassword', 'Confirmar contraseña')}</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} className={inputClass} />
          </div>
          <button
            disabled={passwordSaving || !passwordForm.current || !passwordForm.newPass || !passwordForm.confirm}
            onClick={async () => {
              setPasswordMsg(null);
              if (passwordForm.newPass.length < 6) { setPasswordMsg({ type: 'error', text: t('accountPasswordTooShort', 'La contraseña debe tener al menos 6 caracteres') }); return; }
              if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg({ type: 'error', text: t('accountPasswordMismatch', 'Las contraseñas no coinciden') }); return; }
              setPasswordSaving(true);
              try {
                await changeCustomerPassword(passwordForm.current, passwordForm.newPass);
                setPasswordMsg({ type: 'success', text: t('accountPasswordChanged', 'Contraseña actualizada correctamente') });
                setPasswordForm({ current: '', newPass: '', confirm: '' });
              } catch (err: unknown) {
                const code = (err instanceof Object && 'code' in err ? (err as { code: string }).code : '') || '';
                if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') setPasswordMsg({ type: 'error', text: t('accountWrongCurrentPassword', 'La contraseña actual es incorrecta') });
                else if (code === 'auth/weak-password') setPasswordMsg({ type: 'error', text: t('accountPasswordTooShort', 'La contraseña debe tener al menos 6 caracteres') });
                else setPasswordMsg({ type: 'error', text: t('customerAuthErrorGeneric', 'Ha ocurrido un error. Inténtalo de nuevo.') });
              } finally { setPasswordSaving(false); }
            }}
            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition-colors"
          >
            {passwordSaving && <Loader2 size={14} className="animate-spin" />}
            {t('accountChangePassword', 'Cambiar contraseña')}
          </button>
        </div>
      </div>

      {/* Push notifications */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-brand-muted" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-dark text-sm">{t('pushNotifications', 'Notificaciones push')}</h3>
              <p className="text-xs text-brand-text-tertiary mt-0.5">{t('pushNotificationsDesc', 'Recibe notificaciones sobre tus pedidos')}</p>
            </div>
          </div>
          <button
            disabled={pushLoading}
            onClick={async () => {
              setPushLoading(true);
              try {
                if (pushEnabled) {
                  await disablePush(customer.uid);
                  setPushEnabled(false);
                } else {
                  const ok = await requestPushPermission(customer.uid);
                  setPushEnabled(ok);
                }
              } catch (err) {
                if (import.meta.env.DEV) console.error('Push toggle failed:', err);
              } finally {
                setPushLoading(false);
              }
            }}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${pushEnabled ? 'bg-brand-primary' : 'bg-brand-border'} disabled:opacity-60`}
            aria-label={pushEnabled ? t('disablePush', 'Disable notifications') : t('enablePush', 'Enable notifications')}
          >
            {pushLoading ? (
              <Loader2 size={14} className="absolute top-1.5 left-1/2 -translate-x-1/2 animate-spin text-white" />
            ) : (
              <span className={`block w-5 h-5 bg-brand-surface rounded-full shadow-sm transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Pending deletion banner */}
      {customer.deletionRequestedAt && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-sm">{t('accountDeletionScheduled', 'Cuenta programada para eliminación')}</h3>
                <p className="text-xs text-red-600 mt-1">
                  {t('accountDeletionScheduledDesc', 'Tu cuenta será eliminada permanentemente el {{date}}. Todos tus datos, pedidos y direcciones serán borrados.', {
                    date: new Date(new Date(customer.deletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }),
                  })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-red-500" />
                  <span className="text-[11px] text-red-500 font-medium">
                    {(() => {
                      const daysLeft = Math.max(0, Math.ceil((new Date(customer.deletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)));
                      return t('accountDeletionDaysLeft', '{{days}} días restantes', { days: daysLeft });
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                setCancellingDeletion(true);
                try {
                  await cancelAccountDeletion();
                  onDeletionStatusChange?.(undefined);
                } catch (err) {
                  if (import.meta.env.DEV) console.error('Failed to cancel deletion:', err);
                } finally {
                  setCancellingDeletion(false);
                }
              }}
              disabled={cancellingDeletion}
              className="mt-4 w-full bg-brand-surface hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {cancellingDeletion ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
              {t('accountCancelDeletion', 'Cancelar eliminación de cuenta')}
            </button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Logout */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brand-dark text-sm">{t('customerLogout', 'Cerrar sesión')}</h3>
              <p className="text-xs text-brand-text-tertiary mt-0.5">{t('customerLogoutDesc', 'Salir de tu cuenta en este dispositivo')}</p>
            </div>
            <button onClick={onLogout} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              <LogOut size={14} />
              {t('customerLogout', 'Cerrar sesión')}
            </button>
          </div>

          {/* Delete account */}
          {!customer.deletionRequestedAt && (
            <>
              <div className="border-t border-brand-border-subtle" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm">{t('accountDeleteTitle', 'Eliminar cuenta')}</h3>
                  <p className="text-xs text-brand-text-tertiary mt-0.5">{t('accountDeleteDesc', 'Se eliminará permanentemente tras 30 días')}</p>
                </div>
                <button
                  ref={deleteButtonRef}
                  onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(null); }}
                  className="text-sm font-medium text-red-600 hover:text-white bg-red-50 dark:bg-red-900/20 hover:bg-red-600 border border-red-200 dark:border-red-800 hover:border-red-600 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                >
                  <ShieldX size={14} />
                  {t('accountDeleteButton', 'Eliminar')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-brand-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark">{t('accountDeleteModalTitle', '¿Eliminar tu cuenta?')}</h3>
                  <p className="text-xs text-brand-text-tertiary mt-0.5">{t('accountDeleteModalSubtitle', 'Esta acción no se puede deshacer fácilmente')}</p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-5">
                <p className="text-sm text-red-700">
                  {t('accountDeleteModalWarning', 'Tu cuenta será eliminada permanentemente en 30 días. Se borrarán todos tus datos, pedidos, direcciones y favoritos. Puedes cancelar durante los 30 días.')}
                </p>
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800 mb-4">
                  <XCircle size={16} />
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">
                  {t('accountDeleteConfirmPassword', 'Confirma tu contraseña para continuar')}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className={inputClass}
                  placeholder={t('accountCurrentPassword', 'Contraseña actual')}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-brand-light border-t border-brand-border-subtle">
              <button
                onClick={() => { setShowDeleteModal(false); setTimeout(() => deleteButtonRef.current?.focus(), 0); }}
                disabled={deleteProcessing}
                className="flex-1 text-brand-muted hover:text-brand-dark bg-brand-surface border border-brand-border px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {t('formCancel', 'Cancelar')}
              </button>
              <button
                onClick={async () => {
                  if (!deletePassword) {
                    setDeleteError(t('accountDeletePasswordRequired', 'Introduce tu contraseña'));
                    return;
                  }
                  setDeleteProcessing(true);
                  setDeleteError(null);
                  try {
                    // Re-authenticate first
                    await reauthenticateCustomer(deletePassword);
                    // Then request deletion
                    const result = await requestAccountDeletion();
                    onDeletionStatusChange?.(result.deletionRequestedAt);
                    setShowDeleteModal(false);
                    setTimeout(() => deleteButtonRef.current?.focus(), 0);
                  } catch (err: unknown) {
                    const code = (err instanceof Object && 'code' in err ? (err as { code: string }).code : '') || '';
                    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                      setDeleteError(t('accountWrongCurrentPassword', 'La contraseña es incorrecta'));
                    } else if (code === 'functions/already-exists') {
                      setDeleteError(t('accountDeletionAlreadyRequested', 'Ya existe una solicitud de eliminación'));
                    } else {
                      setDeleteError(t('customerAuthErrorGeneric', 'Ha ocurrido un error. Inténtalo de nuevo.'));
                    }
                  } finally {
                    setDeleteProcessing(false);
                  }
                }}
                disabled={deleteProcessing || !deletePassword}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {deleteProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t('accountDeleteConfirm', 'Eliminar cuenta')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render: Orders
  // -----------------------------------------------------------------------
  const renderOrders = () => (
    <div className="space-y-4">
      {sortedOrders.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border py-20 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
            <Package size={28} className="text-brand-text-tertiary" />
          </div>
          <h3 className="text-brand-dark font-semibold mb-1">{t('customerNoOrders', 'Aún no tienes pedidos')}</h3>
          <p className="text-sm text-brand-text-tertiary mb-6 max-w-xs">{t('customerNoOrdersDesc', 'Explora nuestra tienda y encuentra lo que necesitas')}</p>
          <button onClick={onBack} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {t('customerStartShopping', 'Ir a la tienda')}
          </button>
        </div>
      ) : (
        sortedOrders.map((order) => {
          const isExpanded = expandedOrder === order.id;
          const orderAny = order as any;
          const orderNumber = orderAny.orderNumber || order.id;
          const orderDate = orderAny.createdAt || orderAny.date || '';
          const statusCfg = ORDER_STATUS_CONFIG[order.status];
          const StatusIcon = statusCfg?.icon || Clock;

          return (
            <div key={order.id} className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden transition-shadow hover:shadow-sm">
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between p-3 sm:p-5 text-left"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${statusCfg?.bg || 'bg-brand-light border-brand-border'}`}>
                    <StatusIcon size={18} className={statusCfg?.color || 'text-brand-muted'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-brand-dark font-semibold text-sm">{orderNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusCfg?.bg || 'bg-brand-light border-brand-border'} ${statusCfg?.color || 'text-brand-muted'}`}>
                        {statusCfg ? t(statusCfg.key, order.status) : order.status}
                      </span>
                    </div>
                    <div className="text-xs text-brand-text-tertiary mt-0.5">
                      {orderDate ? new Date(orderDate).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-brand-dark font-bold text-sm">&euro;{order.total.toFixed(2)}</span>
                  <ChevronDown size={16} className={`text-brand-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-brand-border-subtle px-5 py-4 bg-brand-light/50">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img src={item.productImage || item.image} alt={item.productName || item.name} className="w-12 h-12 rounded-xl object-cover bg-brand-surface border border-brand-border-subtle flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-brand-dark font-medium truncate">{item.productName || item.name}</p>
                            {item.selectedColor && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-brand-border flex-shrink-0"
                                style={{ backgroundColor: item.selectedColor }}
                                title={item.selectedColor}
                              />
                            )}
                          </div>
                          <p className="text-xs text-brand-text-tertiary">x{item.quantity}</p>
                        </div>
                        <span className="text-sm text-brand-dark font-medium flex-shrink-0">&euro;{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {orderAny.subtotal != null && (
                    <div className="mt-4 pt-3 border-t border-brand-border space-y-1.5 text-sm">
                      <div className="flex justify-between text-brand-text-tertiary">
                        <span>{t('cartSubtotal', 'Subtotal')}</span>
                        <span>&euro;{orderAny.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-brand-text-tertiary">
                        <span>{t('cartShipping', 'Envío')}</span>
                        <span>{orderAny.shipping === 0 ? t('cartFreeShipping', 'Gratis') : `€${orderAny.shipping.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between text-brand-text-tertiary">
                        <span>{t('cartTax', 'IVA')}</span>
                        <span>&euro;{orderAny.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-brand-dark pt-2 border-t border-brand-border">
                        <span>{t('cartTotal', 'Total')}</span>
                        <span>&euro;{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render: Addresses
  // -----------------------------------------------------------------------
  const renderAddresses = () => (
    <div className="space-y-4">
      {showAddressForm && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-4">
          <h3 className="font-semibold text-brand-dark">
            {editingAddressId ? t('customerEditAddress', 'Editar dirección') : t('customerAddAddress', 'Nueva dirección')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerAddressLabel', 'Etiqueta (ej. Casa, Trabajo)')}</label>
              <input type="text" value={addressForm.label} onChange={e => setAddressForm(f => ({ ...f, label: e.target.value }))} className={inputClass} placeholder={t('accountAddressLabelPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerFullName', 'Nombre completo')}</label>
              <input type="text" value={addressForm.fullName} onChange={e => setAddressForm(f => ({ ...f, fullName: e.target.value }))} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerStreet', 'Dirección')}</label>
              <input type="text" value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))} className={inputClass} placeholder={t('accountStreetPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerCity', 'Ciudad')}</label>
              <input type="text" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerPostalCode', 'Código postal')}</label>
              <input type="text" value={addressForm.postalCode} onChange={e => setAddressForm(f => ({ ...f, postalCode: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerCountry', 'País')}</label>
              <input type="text" value={addressForm.country} onChange={e => setAddressForm(f => ({ ...f, country: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">{t('customerPhone', 'Teléfono')}</label>
              <input type="tel" value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/20" />
            <span className="text-sm text-brand-muted">{t('customerSetDefault', 'Establecer como predeterminada')}</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={handleSaveAddress} disabled={addressSaving} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition-colors">
              {addressSaving && <Loader2 size={14} className="animate-spin" />}
              {editingAddressId ? t('customerSaveProfile', 'Guardar') : t('customerAddAddress', 'Añadir')}
            </button>
            <button onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressForm(emptyAddress); }} className="text-brand-muted hover:text-brand-dark px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              {t('formCancel', 'Cancelar')}
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 && !showAddressForm ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border py-20 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
            <MapPin size={28} className="text-brand-text-tertiary" />
          </div>
          <h3 className="text-brand-dark font-semibold mb-1">{t('customerNoAddresses', 'Sin direcciones guardadas')}</h3>
          <p className="text-sm text-brand-text-tertiary mb-6 max-w-xs">{t('customerNoAddressesDesc', 'Añade una dirección para agilizar tus futuros pedidos')}</p>
          <button onClick={openNewAddressForm} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
            <Plus size={16} />
            {t('customerAddAddress', 'Añadir dirección')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className="bg-brand-surface rounded-2xl border border-brand-border p-5 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-brand-dark font-semibold text-sm">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-md">
                      {t('customerDefaultAddress', 'Predeterminada')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditAddressForm(addr)} className="p-1.5 text-brand-text-tertiary hover:text-brand-primary rounded-lg hover:bg-brand-primary/5 transition-colors" aria-label={t('customerEditAddress', 'Editar')}>
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDeleteAddress(addr.id)} className="p-1.5 text-brand-text-tertiary hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label={t('customerDeleteAddress', 'Eliminar')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-0.5 text-sm">
                <p className="text-brand-dark font-medium">{addr.fullName}</p>
                <p className="text-brand-muted">{addr.street}</p>
                <p className="text-brand-muted">{addr.city}, {addr.postalCode} — {addr.country}</p>
                {addr.phone && <p className="text-brand-text-tertiary text-xs mt-1">{addr.phone}</p>}
              </div>
              {!addr.isDefault && (
                <button onClick={() => onSetDefaultAddress(addr.id)} className="mt-3 text-xs text-brand-primary hover:text-brand-primary-dark font-medium flex items-center gap-1 transition-colors">
                  <Star size={12} />
                  {t('customerSetDefault', 'Establecer como predeterminada')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render: Favorites
  // -----------------------------------------------------------------------
  const renderFavorites = () => (
    <div className="space-y-4">
      {favoritedProducts.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border py-20 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
            <Heart size={28} className="text-brand-text-tertiary" />
          </div>
          <h3 className="text-brand-dark font-semibold mb-1">{t('customerNoFavorites', 'Aún no tienes favoritos')}</h3>
          <p className="text-sm text-brand-text-tertiary mb-6 max-w-xs">{t('customerNoFavoritesDesc', 'Guarda los productos que te gusten para encontrarlos fácilmente')}</p>
          <button onClick={onBack} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {t('customerBackToShop', 'Explorar tienda')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {favoritedProducts.map(product => {
            const outOfStock = product.stock != null && product.stock <= 0;
            return (
            <div key={product.id} className={`bg-brand-surface rounded-2xl border border-brand-border overflow-hidden transition-all group ${outOfStock ? 'opacity-60' : 'hover:shadow-md'}`}>
              <div className="relative aspect-square bg-brand-light">
                <img src={product.image} alt={product.name} className={`w-full h-full object-cover ${outOfStock ? 'grayscale-[50%]' : 'group-hover:scale-105'} transition-transform duration-300`} />
                {outOfStock && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-brand-surface/95 text-brand-dark px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md">
                      <Ban size={14} className="text-red-500" /> {t('outOfStock')}
                    </div>
                  </div>
                )}
                <button onClick={() => onToggleFavorite(product.id)} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-brand-surface/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-brand-surface transition-colors z-10" aria-label={t('removeFromFavorites', 'Quitar de favoritos')}>
                  <Heart size={15} className="text-red-500 fill-red-500" />
                </button>
              </div>
              <div className="p-3.5">
                <h3 className="text-brand-dark font-medium text-sm truncate">{product.name}</h3>
                <p className="text-brand-primary font-bold text-sm mt-0.5">&euro;{product.price.toFixed(2)}</p>
                {outOfStock ? (
                  <div className="mt-2.5 w-full bg-brand-border text-brand-muted py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Ban size={13} />
                    {t('outOfStock')}
                  </div>
                ) : (
                  <button onClick={() => onAddToCart(product)} className="mt-2.5 w-full bg-brand-emphasis hover:bg-brand-emphasis/90 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <ShoppingCart size={13} />
                    {t('addToCart', 'Añadir al carrito')}
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Panel map
  // -----------------------------------------------------------------------
  const panels: Record<AccountTab, () => React.JSX.Element> = {
    profile: renderProfile,
    orders: renderOrders,
    addresses: renderAddresses,
    favorites: renderFavorites,
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-brand-light/80">
      {/* Header */}
      <div className="bg-brand-surface border-b border-brand-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-dark font-medium transition-colors">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{t('customerBackToShop', 'Volver a la tienda')}</span>
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 text-sm text-brand-text-tertiary hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors">
              <LogOut size={14} />
              <span className="hidden sm:inline">{t('customerLogout', 'Cerrar sesión')}</span>
            </button>
          </div>

          {/* Profile summary */}
          <div className="flex items-center gap-4 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-primary/20 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-brand-dark truncate">{customer.displayName}</h1>
              <p className="text-sm text-brand-text-tertiary truncate">{customer.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-none" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-text-tertiary hover:text-brand-muted'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.count != null && tab.count > 0 && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                    activeTab === tab.id ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-light text-brand-text-tertiary'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab action bar */}
      {activeTab === 'addresses' && !showAddressForm && addresses.length > 0 && (
        <div className="bg-brand-surface border-b border-brand-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-end">
            <button onClick={openNewAddressForm} className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
              <Plus size={15} />
              {t('customerAddAddress', 'Añadir dirección')}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {panels[activeTab]()}
      </div>
    </div>
  );
};

export default MyAccountPage;
