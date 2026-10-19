import { Prisma } from '@prisma/client';

// BRL settlement minimum documented at https://docs.stripe.com/currencies.
// Product decision: keep the original debt pending; never round it up or waive it.
export function belowStripeMinimum(amount: Prisma.Decimal.Value): boolean {
  const cents = new Prisma.Decimal(amount).mul(100);
  return cents.isFinite() && cents.isInteger() && cents.gt(0) && cents.lt(50);
}

export const minimumPaymentCode = 'BELOW_PROVIDER_MINIMUM';
export const minimumPaymentMessage = 'O total permanece pendente porque está abaixo do mínimo do cartão. O valor original foi preservado, sem aumento nem confirmação de pagamento.';
