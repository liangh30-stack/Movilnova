import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '@/components/NavBar';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        navShop: 'Shop',
        navTrack: 'Track',

        ariaMainNav: 'Main navigation',
        ariaGoHome: 'MovilNova - Go to homepage',
        ariaSelectLang: 'Select language',
        ariaLangOptions: 'Language options',
        ariaShoppingCart: 'Shopping cart',
        ariaAdminPanel: 'Admin Panel',
        ariaUserAccount: 'User account',
        ariaOpenMenu: 'Open navigation menu',
      };
      return map[key] || key;
    },
  }),
}));

const defaultProps = {
  lang: 'ES' as const,
  onLanguageChange: vi.fn(),
  isLangMenuOpen: false,
  setIsLangMenuOpen: vi.fn(),
  cartItemCount: 0,
  onCartClick: vi.fn(),
  onUserClick: vi.fn(),
  onMobileMenuClick: vi.fn(),
  adminUser: null,
  customer: null,
  themeMode: 'light' as const,
  onThemeChange: vi.fn(),
  isDark: false,
};

const renderNavBar = (overrides = {}) =>
  render(
    <MemoryRouter>
      <NavBar {...defaultProps} {...overrides} />
    </MemoryRouter>
  );

describe('NavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo as a button with accessible label', () => {
    renderNavBar();
    const logo = screen.getByRole('button', { name: /MovilNova.*homepage/i });
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    renderNavBar();
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Track')).toBeInTheDocument();
  });

  it('shows cart badge when items > 0', () => {
    renderNavBar({ cartItemCount: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('hides cart badge when empty', () => {
    renderNavBar({ cartItemCount: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onCartClick when cart button clicked', () => {
    const onCartClick = vi.fn();
    renderNavBar({ onCartClick });
    fireEvent.click(screen.getByRole('button', { name: /shopping cart/i }));
    expect(onCartClick).toHaveBeenCalledOnce();
  });

  it('calls onUserClick when user button clicked', () => {
    const onUserClick = vi.fn();
    renderNavBar({ onUserClick });
    fireEvent.click(screen.getByRole('button', { name: /user account/i }));
    expect(onUserClick).toHaveBeenCalledOnce();
  });

  it('shows admin button when adminUser present', () => {
    renderNavBar({ adminUser: { uid: 'a1', email: 'admin@test.com', role: 'admin' } });
    expect(screen.getByRole('button', { name: /admin panel/i })).toBeInTheDocument();
  });

  it('hides admin button when no adminUser', () => {
    renderNavBar({ adminUser: null });
    expect(screen.queryByRole('button', { name: /admin panel/i })).not.toBeInTheDocument();
  });

  it('shows customer initial when logged in', () => {
    renderNavBar({ customer: { displayName: 'María' } });
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('language selector has aria-haspopup', () => {
    renderNavBar();
    const langButton = screen.getByRole('button', { name: /select language/i });
    expect(langButton).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('toggles language menu on click', () => {
    const setIsLangMenuOpen = vi.fn();
    renderNavBar({ setIsLangMenuOpen, isLangMenuOpen: false });
    fireEvent.click(screen.getByRole('button', { name: /select language/i }));
    expect(setIsLangMenuOpen).toHaveBeenCalledWith(true);
  });

  it('shows language options when menu is open', () => {
    renderNavBar({ isLangMenuOpen: true });
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.getByText(/Español/)).toBeInTheDocument();
    expect(screen.getByText(/Français/)).toBeInTheDocument();
  });

  it('calls onMobileMenuClick for mobile menu', () => {
    const onMobileMenuClick = vi.fn();
    renderNavBar({ onMobileMenuClick });
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(onMobileMenuClick).toHaveBeenCalledOnce();
  });
});
