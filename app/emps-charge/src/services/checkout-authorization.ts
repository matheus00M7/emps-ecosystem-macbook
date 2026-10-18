import type { PaymentMethod } from '@/domain/models';
import type { MobileApi } from './mobile-api';

export type CheckoutInput = {
  chargerId: string;
  paymentMethod: PaymentMethod;
  spendingLimit: number | null;
};

type CheckoutApi = Pick<MobileApi,
  'createPaymentIntent' | 'paymentIntent' | 'cancelPaymentIntent' | 'startCharging'>;

export class CheckoutAuthorization {
  private intentId?: string;
  rejected = false;

  constructor(
    private readonly api: CheckoutApi,
    readonly input: CheckoutInput,
    private readonly keys: { payment: string; start: string },
    private readonly confirm: (secret: string) => Promise<{ canceled: boolean }>,
    private readonly assertCurrent: () => void = () => {},
    private readonly wait: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 600)),
  ) {}

  matches(input: CheckoutInput) {
    return this.input.chargerId === input.chargerId &&
      this.input.paymentMethod === input.paymentMethod &&
      this.input.spendingLimit === input.spendingLimit;
  }

  private async intent() {
    this.assertCurrent();
    const intent = await this.api.createPaymentIntent(
      this.input.chargerId, this.input.paymentMethod, this.input.spendingLimit, this.keys.payment,
    );
    this.assertCurrent();
    this.intentId = intent.id;
    return intent;
  }

  async authorize() {
    let payment = await this.intent();
    if (payment.status === 'rejected') {
      this.rejected = true;
      throw new Error('Pagamento recusado. Escolha outra forma de pagamento.');
    }
    if (payment.status === 'requires_action') {
      if (!payment.providerClientSecret) throw new Error('Confirmação indisponível. Tente novamente.');
      const result = await this.confirm(payment.providerClientSecret);
      this.assertCurrent();
      if (result.canceled) throw new Error('Pagamento cancelado. Você pode trocar a forma de pagamento.');
      for (let attempt = 0; attempt < 10 && payment.status === 'requires_action'; attempt += 1) {
        await this.wait();
        this.assertCurrent();
        payment = await this.api.paymentIntent(payment.id);
        this.assertCurrent();
      }
    }
    if (payment.status !== 'authorized') {
      throw new Error('A autorização ainda não foi confirmada. Tente novamente em instantes.');
    }
  }

  async cancel() {
    this.assertCurrent();
    // Recover the same request after an uncertain response before changing its parameters.
    const id = this.intentId ?? (await this.intent()).id;
    await this.api.cancelPaymentIntent(id);
    this.assertCurrent();
  }

  async start(qrBindingId: string, chargePolicyVersion?: 'PREPAID_LIMIT_V2') {
    this.assertCurrent();
    if (!this.intentId) throw new Error('Confirme o pagamento antes de iniciar a recarga.');
    const payment = await this.api.paymentIntent(this.intentId);
    this.assertCurrent();
    if (payment.status !== 'authorized') {
      throw new Error('A autorização expirou. Confirme o pagamento novamente.');
    }
    const session = await this.api.startCharging({
      ...(chargePolicyVersion ? { chargePolicyVersion } : {}),
      idempotencyKey: this.keys.start,
      paymentIntentId: this.intentId,
      qrBindingId,
      spendingLimit: this.input.spendingLimit,
    });
    this.assertCurrent();
    return session;
  }
}
