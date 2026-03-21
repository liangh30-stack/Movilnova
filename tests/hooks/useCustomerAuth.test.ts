import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Customer } from '@/types';

// ---------- Mock customerService ----------
const mockOnCustomerAuthChange = vi.fn();

vi.mock('@/services/customerService', () => ({
  signInCustomer: vi.fn(),
  registerCustomer: vi.fn(),
  signOutCustomer: vi.fn(),
  sendCustomerPasswordReset: vi.fn(),
  updateCustomerProfile: vi.fn(),
  onCustomerAuthChange: (...args: unknown[]) => mockOnCustomerAuthChange(...args),
}));

import {
  signInCustomer,
  registerCustomer,
  signOutCustomer,
  sendCustomerPasswordReset,
  updateCustomerProfile,
} from '@/services/customerService';

import { useCustomerAuth } from '@/hooks/useCustomerAuth';

// ---------- Helpers ----------
const fakeCustomer: Customer = {
  uid: 'cust-001',
  email: 'maria@example.com',
  displayName: 'María López',
  phone: '+34 600 111 222',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

/**
 * By default the auth-state listener fires immediately with `null`
 * (no user logged in). Tests that need a logged-in user can override
 * this by providing a customer to the helper.
 */
const setupAuthListener = (initialCustomer: Customer | null = null) => {
  mockOnCustomerAuthChange.mockImplementation(
    (cb: (c: Customer | null) => void) => {
      cb(initialCustomer);
      return vi.fn(); // unsubscribe
    },
  );
};

// ---------- Tests ----------
describe('useCustomerAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthListener(null);
  });

  // ---- Auth state listener ----
  it('subscribes to auth state on mount and sets customer', async () => {
    setupAuthListener(fakeCustomer);

    const { result } = renderHook(() => useCustomerAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockOnCustomerAuthChange).toHaveBeenCalledOnce();
    expect(result.current.customer).toEqual(fakeCustomer);
  });

  it('sets customer to null when auth listener fires with no user', async () => {
    setupAuthListener(null);

    const { result } = renderHook(() => useCustomerAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.customer).toBeNull();
  });

  // ---- Login ----
  it('logs in successfully and updates customer state', async () => {
    setupAuthListener(null);
    vi.mocked(signInCustomer).mockResolvedValue(fakeCustomer);

    const { result } = renderHook(() => useCustomerAuth());

    await act(async () => {
      await result.current.login('maria@example.com', 'secret123');
    });

    expect(signInCustomer).toHaveBeenCalledWith('maria@example.com', 'secret123');
    expect(result.current.customer).toEqual(fakeCustomer);
    expect(result.current.isLoading).toBe(false);
  });

  it('throws on login failure and keeps customer null', async () => {
    setupAuthListener(null);
    const firebaseError = { code: 'auth/wrong-password', message: 'Wrong password' };
    vi.mocked(signInCustomer).mockRejectedValue(firebaseError);

    const { result } = renderHook(() => useCustomerAuth());

    await expect(
      act(async () => {
        await result.current.login('maria@example.com', 'wrong');
      }),
    ).rejects.toEqual(firebaseError);

    expect(result.current.customer).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ---- Register ----
  it('registers successfully and updates customer state', async () => {
    setupAuthListener(null);
    vi.mocked(registerCustomer).mockResolvedValue(fakeCustomer);

    const { result } = renderHook(() => useCustomerAuth());

    await act(async () => {
      await result.current.register('maria@example.com', 'secret123', 'María López');
    });

    expect(registerCustomer).toHaveBeenCalledWith('maria@example.com', 'secret123', 'María López');
    expect(result.current.customer).toEqual(fakeCustomer);
    expect(result.current.isLoading).toBe(false);
  });

  it('throws on register failure and keeps customer null', async () => {
    setupAuthListener(null);
    const firebaseError = { code: 'auth/email-already-in-use', message: 'Email in use' };
    vi.mocked(registerCustomer).mockRejectedValue(firebaseError);

    const { result } = renderHook(() => useCustomerAuth());

    await expect(
      act(async () => {
        await result.current.register('maria@example.com', 'secret123', 'María López');
      }),
    ).rejects.toEqual(firebaseError);

    expect(result.current.customer).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ---- Logout ----
  it('logs out and clears customer state', async () => {
    setupAuthListener(fakeCustomer);
    vi.mocked(signOutCustomer).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCustomerAuth());

    await waitFor(() => {
      expect(result.current.customer).toEqual(fakeCustomer);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(signOutCustomer).toHaveBeenCalledOnce();
    expect(result.current.customer).toBeNull();
  });

  // ---- Reset password ----
  it('sends password reset email', async () => {
    setupAuthListener(null);
    vi.mocked(sendCustomerPasswordReset).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCustomerAuth());

    await act(async () => {
      await result.current.resetPassword('maria@example.com');
    });

    expect(sendCustomerPasswordReset).toHaveBeenCalledWith('maria@example.com');
  });

  // ---- Update profile ----
  it('updates profile and merges changes into customer state', async () => {
    setupAuthListener(fakeCustomer);
    vi.mocked(updateCustomerProfile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCustomerAuth());

    await waitFor(() => {
      expect(result.current.customer).toEqual(fakeCustomer);
    });

    await act(async () => {
      await result.current.updateProfile({ displayName: 'María G.' });
    });

    expect(updateCustomerProfile).toHaveBeenCalledWith('cust-001', { displayName: 'María G.' });
    expect(result.current.customer?.displayName).toBe('María G.');
    expect(result.current.customer?.updatedAt).toBeDefined();
  });

  it('does nothing when updateProfile is called without a logged-in customer', async () => {
    setupAuthListener(null);

    const { result } = renderHook(() => useCustomerAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateProfile({ displayName: 'Ghost' });
    });

    expect(updateCustomerProfile).not.toHaveBeenCalled();
    expect(result.current.customer).toBeNull();
  });
});
