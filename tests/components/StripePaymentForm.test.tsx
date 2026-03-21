import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ---------- Mock react-i18next ----------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        paymentPayNow: 'Pay now',
        paymentProcessing: 'Processing…',
        paymentSecure: 'Secure payment',
        paymentPoweredByStripe: 'Powered by Stripe',
        paymentErrorDeclined: 'Your card was declined.',
        paymentErrorGeneric: 'An unexpected error occurred.',
        paymentStripeLoading: 'Loading payment form…',
      };
      return map[key] || key;
    },
  }),
}));

// ---------- Stripe mocks ----------
const mockConfirmPayment = vi.fn();
const mockUseStripe = vi.fn();
const mockUseElements = vi.fn();

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: (props: Record<string, unknown>) => <div data-testid="payment-element" {...props} />,
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}));

// Import the component AFTER all mocks are set up
import StripePaymentForm from '@/components/checkout/StripePaymentForm';

// ---------- Helpers ----------
const defaultProps = {
  clientSecret: 'pi_test_secret_abc123',
  total: 29.99,
  currencySymbol: '€',
  onPaymentSuccess: vi.fn(),
  onPaymentError: vi.fn(),
};

const renderForm = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<StripePaymentForm {...defaultProps} {...overrides} />);

// ---------- Tests ----------
describe('StripePaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: stripe and elements are available
    mockUseStripe.mockReturnValue({ confirmPayment: mockConfirmPayment });
    mockUseElements.mockReturnValue({});
  });

  it('renders the PaymentElement when clientSecret is provided', () => {
    renderForm();

    expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    expect(screen.getByText(/Pay now/)).toBeInTheDocument();
    expect(screen.getByText(/€29.99/)).toBeInTheDocument();
  });

  it('shows loading state when no clientSecret is provided', () => {
    renderForm({ clientSecret: '' });

    expect(screen.getByText('Loading payment form…')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-element')).not.toBeInTheDocument();
  });

  it('calls onPaymentSuccess after a successful payment', async () => {
    const onPaymentSuccess = vi.fn();
    mockConfirmPayment.mockResolvedValue({
      error: null,
      paymentIntent: { id: 'pi_success_123', status: 'succeeded' },
    });

    renderForm({ onPaymentSuccess });

    const submitButton = screen.getByRole('button', { name: /Pay now/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onPaymentSuccess).toHaveBeenCalledWith('pi_success_123');
    });

    expect(mockConfirmPayment).toHaveBeenCalledOnce();
  });

  it('displays card error message and calls onPaymentError for card_error', async () => {
    const onPaymentError = vi.fn();
    mockConfirmPayment.mockResolvedValue({
      error: {
        type: 'card_error',
        message: 'Your card has insufficient funds.',
      },
      paymentIntent: null,
    });

    renderForm({ onPaymentError });

    const submitButton = screen.getByRole('button', { name: /Pay now/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Your card has insufficient funds.')).toBeInTheDocument();
    });

    expect(onPaymentError).toHaveBeenCalledWith('Your card has insufficient funds.');
  });

  it('displays generic error message for non-card errors', async () => {
    const onPaymentError = vi.fn();
    mockConfirmPayment.mockResolvedValue({
      error: {
        type: 'api_error',
        message: 'Internal server error',
      },
      paymentIntent: null,
    });

    renderForm({ onPaymentError });

    const submitButton = screen.getByRole('button', { name: /Pay now/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });

    expect(onPaymentError).toHaveBeenCalledWith('An unexpected error occurred.');
  });

  it('disables submit button while payment is processing', async () => {
    // Make confirmPayment hang until we resolve it
    let resolvePayment!: (value: unknown) => void;
    mockConfirmPayment.mockReturnValue(
      new Promise((resolve) => {
        resolvePayment = resolve;
      }),
    );

    renderForm();

    const submitButton = screen.getByRole('button', { name: /Pay now/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Processing…')).toBeInTheDocument();
    });

    // The button should be disabled during processing
    const processingButton = screen.getByRole('button');
    expect(processingButton).toBeDisabled();

    // Resolve the payment to clean up
    resolvePayment({
      error: null,
      paymentIntent: { id: 'pi_123', status: 'succeeded' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Pay now/)).toBeInTheDocument();
    });
  });

  it('disables submit button when stripe is not yet loaded', () => {
    mockUseStripe.mockReturnValue(null);

    renderForm();

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('handles unexpected exceptions during confirmPayment', async () => {
    const onPaymentError = vi.fn();
    mockConfirmPayment.mockRejectedValue(new Error('Network failure'));

    renderForm({ onPaymentError });

    const submitButton = screen.getByRole('button', { name: /Pay now/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });

    expect(onPaymentError).toHaveBeenCalledWith('An unexpected error occurred.');
  });
});
