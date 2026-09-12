import { useMemo, useState, type ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const STRIPE_ENABLED =
  String(import.meta.env.VITE_STRIPE_ENABLED || '').toLowerCase() === 'true' &&
  Boolean(STRIPE_PUBLISHABLE_KEY);

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#111827',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af', fontWeight: '500' },
    },
    invalid: { color: '#ef4444' },
  },
  disableLink: true,
};

function Field({ label, error, children }: { label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block w-full min-w-0">
      <span className="mb-1.5 flex min-h-[1.125rem] items-center gap-1 text-sm font-sans leading-relaxed text-gray-600 dark:text-gray-300">
        {label}
      </span>
      <span
        className={`flex min-h-12 w-full items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition focus-within:border-mintcom-green focus-within:ring-2 focus-within:ring-mintcom-green/20 dark:bg-black/20 ${
          error ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'
        }`}
      >
        {children}
      </span>
      <span className="mt-1 block min-h-[1rem] text-xs font-sans font-semibold text-mintcom-red">
        {error || '\u00A0'}
      </span>
    </label>
  );
}

/**
 * Renders the real Stripe Elements card inputs.
 * `onReady` receives a handler that tokenizes the card via Stripe and returns
 * the resulting payment method id, or throws with a user-facing message.
 */
export function StripeCardSection({
  onReady,
}: {
  onReady: (tokenize: () => Promise<string>) => void;
}) {
  return (
    <Elements stripe={getStripe()} options={{ locale: 'auto' }}>
      <StripeCardInner onReady={onReady} />
    </Elements>
  );
}

function StripeCardInner({ onReady }: { onReady: (tokenize: () => Promise<string>) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | undefined>();

  const tokenize = useMemo(
    () => async () => {
      if (!stripe || !elements) {
        throw new Error('Stripe is still loading. Please try again.');
      }
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) {
        throw new Error('Card field is not ready.');
      }
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
      });
      if (stripeError) {
        setError(stripeError.message || 'Card could not be validated.');
        throw new Error(stripeError.message || 'Card could not be validated.');
      }
      setError(undefined);
      return paymentMethod!.id;
    },
    [stripe, elements],
  );

  // Hand the tokenizer up so the parent <form> submit can use it. Runs on every render.
  onReady(tokenize);

  return (
    <div className="space-y-1">
      <Field label="Card Number" error={error}>
        <CardNumberElement options={ELEMENT_OPTIONS} className="min-w-0 flex-1" />
        <CreditCard size={18} className="shrink-0 text-gray-400" aria-hidden />
      </Field>

      <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 sm:items-start">
        <Field label="Expiry Date">
          <CardExpiryElement options={ELEMENT_OPTIONS} className="min-w-0 flex-1" />
        </Field>
        <Field label="CVV">
          <CardCvcElement options={ELEMENT_OPTIONS} className="min-w-0 flex-1" />
        </Field>
      </div>

      <p className="flex items-center gap-1.5 pt-1 text-xs font-sans text-gray-400">
        <Loader2 size={12} className="animate-spin" /> Powered by Stripe
      </p>
    </div>
  );
}
