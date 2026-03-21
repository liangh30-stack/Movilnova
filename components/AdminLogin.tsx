import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signIn, type AppUser } from '../services/authService';
import { LogIn, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';


interface AdminLoginProps {
  onLoginSuccess: (user: AppUser) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(t('adminValidationError') || 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);

    try {
      const user = await signIn(email, password);

      // Solo dejar pasar admins
      if (user.role !== 'admin') {
        setError('No tienes permisos de administrador');
        return;
      }

      onLoginSuccess(user);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/too-many-requests') {
        setError(t('adminErrorTooManyRequests') || 'Demasiados intentos. Intenta más tarde');
      } else {
        // Unified message for all credential errors to prevent user enumeration
        setError(t('adminErrorInvalidCredential') || 'Credenciales inválidas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-dark mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">{t('adminBackToShop') || 'Volver a la tienda'}</span>
        </button>

        <div className="bg-brand-surface rounded-lg border border-brand-border shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield size={36} className="text-brand-primary" />
            </div>
            <h1 className="text-2xl font-bold text-brand-dark tracking-tight">{t('adminTitle') || 'Panel de Administración'}</h1>
            <p className="text-brand-muted text-sm mt-2">{t('adminSubtitle') || 'Acceso restringido para personal autorizado'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" role="form">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-2">
                {t('adminEmail') || 'Correo electrónico'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@movilnova.com"
                disabled={isLoading}
                aria-label={t('adminEmail') || 'Correo electrónico'}
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3.5 text-brand-dark placeholder:text-brand-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-2">
                {t('adminPassword') || 'Contraseña'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                aria-label={t('adminPassword') || 'Contraseña'}
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3.5 text-brand-dark placeholder:text-brand-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 text-brand-critical text-sm bg-brand-critical/10 border border-brand-critical/20 rounded-lg px-4 py-3">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-lg font-semibold text-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-white" />
                  <span>{t('adminLoggingIn') || 'Iniciando...'}</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>{t('adminLoginButton') || 'Iniciar sesión'}</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-brand-text-tertiary mt-6">
            {t('adminFooter') || 'Solo personal autorizado'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
