import { useState, useEffect } from 'react';
import type { Customer } from '../types';
import {
  registerCustomer,
  signInCustomer,
  signOutCustomer,
  sendCustomerPasswordReset,
  onCustomerAuthChange,
  updateCustomerProfile,
} from '../services/customerService';

export const useCustomerAuth = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onCustomerAuthChange((c) => {
      setCustomer(c);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const c = await signInCustomer(email, password);
      setCustomer(c);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      throw fbErr; // Let the UI component handle the error mapping
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const c = await registerCustomer(email, password, displayName);
      setCustomer(c);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      throw fbErr;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOutCustomer();
    setCustomer(null);
  };

  const resetPassword = async (email: string) => {
    await sendCustomerPasswordReset(email);
  };

  const updateProfile = async (data: Partial<Customer>) => {
    if (!customer) return;
    await updateCustomerProfile(customer.uid, data);
    setCustomer({ ...customer, ...data, updatedAt: new Date().toISOString() });
  };

  const updateDeletionStatus = (deletionRequestedAt: string | undefined) => {
    if (!customer) return;
    setCustomer({ ...customer, deletionRequestedAt, updatedAt: new Date().toISOString() });
  };

  return {
    customer,
    isLoading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    updateDeletionStatus,
  };
};
