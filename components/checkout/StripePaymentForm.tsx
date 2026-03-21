import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2, Lock, CreditCard } from 'lucide-react';
import { stripePromise } from '../../services/stripeProxy';

interface StripePaymentFormProps {
  clientSecret: string;
  total: number;
  currencySymbol: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

const CheckoutForm: React.FC<{
  total: number;
  currencySymbol: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}> = ({ total, currencySymbol, onPaymentSuccess, onPaymentError }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        const msg = error.type === 'card_error' || error.type === 'validation_error'
          ? error.message || t('paymentErrorDeclined')
          : t('paymentErrorGeneric');
        setErrorMessage(msg);
        onPaymentError(msg);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err) {
      const msg = t('paymentErrorGeneric');
      setErrorMessage(msg);
      onPaymentError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        }}
      />

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-brand-emphasis text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {t('paymentProcessing')}
          </>
        ) : (
          <>
            <CreditCard size={20} />
            {t('paymentPayNow')} · {currencySymbol}{total.toFixed(2)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-brand-muted">
        <Lock size={10} />
        <span>{t('paymentSecure')}</span>
        <span className="mx-1">·</span>
        <span>{t('paymentPoweredByStripe')}</span>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  total,
  currencySymbol,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { t } = useTranslation();

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: isDark ? 'night' : 'stripe',
      variables: {
        colorPrimary: '#008060',
        borderRadius: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        ...(isDark && {
          colorBackground: '#1e1e1e',
          colorText: '#e0e0e0',
        }),
      },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8 text-brand-muted">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">{t('paymentStripeLoading')}</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CheckoutForm
        total={total}
        currencySymbol={currencySymbol}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default StripePaymentForm;
