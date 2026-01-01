import { supabase } from '@/lib/supabase';

export interface PaymentMethod {
  id: string;
  passenger_id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash';
  provider?: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  cardholder_name?: string;
  is_default: boolean;
  billing_address?: any;
  created_at: string;
  updated_at: string;
}

export async function getPaymentMethods(passengerId: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('passenger_id', passengerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDefaultPaymentMethod(passengerId: string): Promise<PaymentMethod | null> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('passenger_id', passengerId)
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addPaymentMethod(
  passengerId: string,
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash';
    provider?: string;
    last_four?: string;
    expiry_month?: number;
    expiry_year?: number;
    cardholder_name?: string;
    is_default?: boolean;
    billing_address?: any;
  }
): Promise<PaymentMethod> {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert([
      {
        passenger_id: passengerId,
        ...paymentMethod,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePaymentMethod(
  paymentMethodId: string,
  updates: {
    is_default?: boolean;
    cardholder_name?: string;
    billing_address?: any;
  }
): Promise<PaymentMethod> {
  const { data, error } = await supabase
    .from('payment_methods')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentMethodId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setDefaultPaymentMethod(
  passengerId: string,
  paymentMethodId: string
): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', paymentMethodId)
    .eq('passenger_id', passengerId);

  if (error) throw error;
}

export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', paymentMethodId);

  if (error) throw error;
}

export function getPaymentMethodIcon(type: string): string {
  switch (type) {
    case 'card':
      return 'credit-card';
    case 'paypal':
      return 'paypal';
    case 'apple_pay':
      return 'apple';
    case 'google_pay':
      return 'google';
    case 'cash':
      return 'banknote';
    default:
      return 'credit-card';
  }
}

export function getCardProviderIcon(provider?: string): string {
  if (!provider) return 'credit-card';

  switch (provider.toLowerCase()) {
    case 'visa':
      return 'credit-card';
    case 'mastercard':
      return 'credit-card';
    case 'amex':
    case 'american express':
      return 'credit-card';
    case 'discover':
      return 'credit-card';
    default:
      return 'credit-card';
  }
}

export function formatCardNumber(lastFour?: string): string {
  if (!lastFour) return '';
  return `•••• ${lastFour}`;
}

export function isCardExpired(expiryMonth?: number, expiryYear?: number): boolean {
  if (!expiryMonth || !expiryYear) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (expiryYear < currentYear) return true;
  if (expiryYear === currentYear && expiryMonth < currentMonth) return true;

  return false;
}

export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export function detectCardProvider(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';

  return 'Unknown';
}
