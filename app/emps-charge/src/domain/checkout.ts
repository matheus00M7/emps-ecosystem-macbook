import type { Charger, PaymentMethod } from './models';

export function demoPayment(
  options: Charger['paymentOptions'],
  method: PaymentMethod,
  demoMode = false,
): boolean {
  return demoMode || options?.paymentProvider === 'sandbox' ||
    (method !== 'card' && options?.demoPayments === true);
}

export function availablePayment(
  options: Charger['paymentOptions'],
  method: PaymentMethod,
  demoMode = false,
): boolean {
  return method === 'card' || demoPayment(options, method, demoMode);
}

export function checkoutAmount(value: string): number | null {
  const text = value.trim();
  if (!/^\d+(?:[.,]\d{0,2})?$/.test(text)) return null;
  const amount = Number(text.replace(',', '.'));
  return Number.isFinite(amount) && amount >= 1 && amount <= 10000 ? amount : null;
}
