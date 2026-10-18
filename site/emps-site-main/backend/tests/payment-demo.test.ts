import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { PaymentGatewayService, paymentCapabilities } from '../src/payment-gateway.service';

test('API hospedada permite Pix/carteira Demo opt-in sem trocar o cartao Stripe', () => {
  const env = { NODE_ENV: 'production', PAYMENT_PROVIDER: 'stripe', STRIPE_SECRET_KEY: 'sk_test_unit_only', ENABLE_DEMO_PAYMENTS: 'true' };
  assert.deepEqual(paymentCapabilities(env), { paymentProvider: 'stripe', demoPayments: true, stripePublishableKey: undefined });
  assert.equal(paymentCapabilities({ ...env, ENABLE_DEMO_PAYMENTS: 'false' }).demoPayments, false);
  assert.equal(paymentCapabilities({ ...env, STRIPE_SECRET_KEY: 'sk_live_unit_only' }).demoPayments, false);
  assert.equal(paymentCapabilities({ ...env, STRIPE_SECRET_KEY: undefined }).demoPayments, false);
});

test('Pix/carteira no modo misto autorizam e liquidam somente no Sandbox', async t => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, {
      NODE_ENV: 'production', PAYMENT_PROVIDER: 'stripe', STRIPE_SECRET_KEY: 'sk_test_unit_only',
      ENABLE_DEMO_PAYMENTS: 'true', EMPS_REMOTE_DEVELOPMENT: 'false',
      EMPS_EXTERNAL_PAYMENT_SIDE_EFFECTS_ENABLED: 'true',
    });
    t.mock.method(globalThis, 'fetch', async () => { throw new Error('Nao deve acessar banco ou provedor externo'); });
    const gateway = new PaymentGatewayService();
    const stripe = (gateway as unknown as { stripe: { paymentIntents: { create: () => unknown } } }).stripe;
    let external = 0;
    t.mock.method(stripe.paymentIntents, 'create', async () => { external += 1; throw new Error('Cartao Stripe nao deve ser usado para Pix/carteira Demo'); });
    for (const method of ['pix', 'wallet'] as const) {
      const intent = await gateway.createIntent({ method, internalIntentId: 'unit-demo', idempotencyKey: 'unit-key', spendingLimit: 20 });
      assert.equal(intent.provider, 'SANDBOX');
      assert.equal(intent.status, 'authorized');
      assert.equal(intent.clientSecret, undefined);
      const payment = await gateway.settleIntent({ method, amount: 8.89, provider: 'sandbox', externalId: intent.externalId });
      assert.equal(payment.status, 'approved');
      assert.equal(payment.capturedAmount, 8.89);
    }
    assert.equal(external, 0);
    await assert.rejects(gateway.createIntent({ method: 'card', internalIntentId: 'unit-card', idempotencyKey: 'card-unit-key', spendingLimit: 20 }), /Cartao Stripe/);
    assert.equal(external, 1);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
