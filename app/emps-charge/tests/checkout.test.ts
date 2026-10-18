import assert from 'node:assert/strict';
import test from 'node:test';
import { availablePayment, checkoutAmount, demoPayment } from '../src/domain/checkout';
import type { ChargingSession, PaymentMethod } from '../src/domain/models';
import { CheckoutAuthorization } from '../src/services/checkout-authorization';
import type { PaymentIntent } from '../src/services/mobile-api';

function fixture(method: PaymentMethod = 'pix', assertCurrent = () => {}) {
  const calls: { action: string; values: unknown[] }[] = [];
  const payment: PaymentIntent = { id: 'intent-test', method, status: 'authorized' };
  const session = { id: 'session-test', chargerId: '67', stationId: '39', status: 'charging' } as ChargingSession;
  const api = {
    createPaymentIntent: async (...values: [string, PaymentMethod, number | null, string]) => {
      calls.push({ action: 'authorize', values }); return { ...payment };
    },
    paymentIntent: async (id: string) => { calls.push({ action: 'read', values: [id] }); return { ...payment }; },
    cancelPaymentIntent: async (id: string) => { calls.push({ action: 'cancel', values: [id] }); },
    startCharging: async (value: Parameters<import('../src/services/mobile-api').MobileApi['startCharging']>[0]) => {
      calls.push({ action: 'start', values: [value] }); return session;
    },
  };
  const input = { chargerId: '67', paymentMethod: method, spendingLimit: 20 };
  let canceled = false;
  const confirm = async (secret: string) => { calls.push({ action: 'stripe', values: [secret] }); return { canceled }; };
  const operation = new CheckoutAuthorization(api, input, { payment: 'payment-key-test', start: 'start-key-test' }, confirm, assertCurrent, async () => {});
  return { api, payment, session, calls, input, operation, setCanceled: () => { canceled = true; } };
}

test('Pix e carteira usam confirmacao do backend sem abrir Stripe', async () => {
  for (const method of ['pix', 'wallet'] as const) {
    const f = fixture(method);
    await f.operation.authorize();
    assert.equal(await f.operation.start('binding-test', 'PREPAID_LIMIT_V2'), f.session);
    assert.deepEqual(f.calls.map(call => call.action), ['authorize', 'read', 'start']);
    assert.deepEqual(f.calls[2].values[0], {
      chargePolicyVersion: 'PREPAID_LIMIT_V2', idempotencyKey: 'start-key-test',
      paymentIntentId: 'intent-test', qrBindingId: 'binding-test', spendingLimit: 20,
    });
  }
});

test('cartao que exige confirmacao usa Stripe e aguarda a resposta do servidor', async () => {
  const f = fixture('card');
  f.payment.status = 'requires_action';
  f.payment.providerClientSecret = 'pi_test_secret_example';
  f.api.paymentIntent = async id => {
    f.calls.push({ action: 'read', values: [id] });
    return { ...f.payment, status: 'authorized' };
  };
  await f.operation.authorize();
  await f.operation.start('binding-test');
  assert.deepEqual(f.calls.map(call => call.action), ['authorize', 'stripe', 'read', 'read', 'start']);
});

test('cancelar a tela Stripe permite cancelar a autorizacao conhecida antes da troca', async () => {
  const f = fixture('card');
  f.payment.status = 'requires_action';
  f.payment.providerClientSecret = 'pi_test_secret_example';
  f.setCanceled();
  await assert.rejects(f.operation.authorize(), /cancelado/);
  await f.operation.cancel();
  assert.deepEqual(f.calls.map(call => call.action), ['authorize', 'stripe', 'cancel']);
  assert.equal(f.operation.matches({ ...f.input, paymentMethod: 'pix' }), false);
  assert.equal(f.operation.matches({ ...f.input, spendingLimit: 30 }), false);
});

test('falha de cancelamento nao descarta a autorizacao nem cria outra', async () => {
  const f = fixture();
  await f.operation.authorize();
  f.api.cancelPaymentIntent = async () => { throw new Error('conexao indisponivel'); };
  await assert.rejects(f.operation.cancel(), /conexao/);
  f.api.cancelPaymentIntent = async id => { f.calls.push({ action: 'cancel', values: [id] }); };
  await f.operation.cancel();
  assert.deepEqual(f.calls.map(call => call.action), ['authorize', 'cancel']);
});

test('resposta perdida e recuperada com os mesmos parametros e chave antes de cancelar', async () => {
  const f = fixture();
  const create = f.api.createPaymentIntent;
  let count = 0;
  f.api.createPaymentIntent = async (...values) => {
    count += 1;
    if (count === 1) { f.calls.push({ action: 'lost', values }); throw new Error('timeout'); }
    return create(...values);
  };
  await assert.rejects(f.operation.authorize(), /timeout/);
  await f.operation.cancel();
  assert.deepEqual(f.calls[0].values, f.calls[1].values);
  assert.deepEqual(f.calls.map(call => call.action), ['lost', 'authorize', 'cancel']);
});

test('retry do inicio conserva chave, vinculo e valor sem gerar outra autorizacao', async () => {
  const f = fixture();
  await f.operation.authorize();
  const start = f.api.startCharging;
  let attempt = 0;
  f.api.startCharging = async value => {
    attempt += 1;
    if (attempt === 1) { f.calls.push({ action: 'lost-start', values: [value] }); throw new Error('timeout'); }
    return start(value);
  };
  await assert.rejects(f.operation.start('binding-test'), /timeout/);
  await f.operation.start('binding-test');
  assert.deepEqual(f.calls.find(call => call.action === 'lost-start')?.values, f.calls.find(call => call.action === 'start')?.values);
  assert.equal(f.calls.filter(call => call.action === 'authorize').length, 1);
});

test('rejeicao, autorizacao ausente e confirmacao pendente nunca iniciam uma sessao', async () => {
  const f = fixture();
  await assert.rejects(f.operation.start('binding-test'), /Confirme/);
  f.payment.status = 'rejected';
  await assert.rejects(f.operation.authorize(), /recusado/);
  assert.equal(f.operation.rejected, true);
  f.payment.status = 'requires_action';
  await assert.rejects(f.operation.start('binding-test'), /expirou/);
  assert.equal(f.calls.some(call => call.action === 'start'), false);
});

test('uma troca de conta interrompe a operacao antiga antes de iniciar a recarga', async () => {
  let current = true;
  const f = fixture('pix', () => { if (!current) throw new Error('conta mudou'); });
  await f.operation.authorize();
  current = false;
  await assert.rejects(f.operation.start('binding-test'), /conta mudou/);
  assert.equal(f.calls.some(call => call.action === 'start'), false);
});

test('Stripe continua externo e Pix/carteira sao Demo somente quando anunciados', () => {
  const enabled = { paymentProvider: 'stripe', demoPayments: true };
  assert.equal(demoPayment(enabled, 'card'), false);
  for (const method of ['pix', 'wallet'] as const) {
    assert.equal(availablePayment(enabled, method), true);
    assert.equal(demoPayment(enabled, method), true);
    assert.equal(availablePayment({ ...enabled, demoPayments: false }, method), false);
    assert.equal(availablePayment(undefined, method), false);
  }
  assert.equal(availablePayment(undefined, 'card'), true);
  assert.equal(demoPayment({ paymentProvider: 'sandbox', demoPayments: true }, 'card'), true);
});

test('valor em reais aceita virgula e rejeita valores invalidos ou fracao de centavo', () => {
  for (const [raw, expected] of [['12,50', 12.5], ['20.00', 20], [' 1 ', 1], ['10000', 10000]] as const) assert.equal(checkoutAmount(raw), expected);
  for (const raw of ['', '0', '-1', 'NaN', 'Infinity', '10000,01', '1,234', '1e3', '1.000,00']) assert.equal(checkoutAmount(raw), null, raw);
});
