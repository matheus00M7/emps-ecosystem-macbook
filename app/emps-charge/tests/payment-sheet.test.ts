import assert from 'node:assert/strict';
import test from 'node:test';
import { confirmStripePayment } from '../src/services/payment-sheet-core';

function fixture() {
  const calls: { action: string; input?: unknown }[] = [];
  const sdk = {
    initStripe: async (input: { publishableKey: string; urlScheme: string }) => { calls.push({ action: 'initialize', input }); },
    initPaymentSheet: async (input: { merchantDisplayName: string; paymentIntentClientSecret: string; returnURL: string }): Promise<{ error?: { message: string; code?: string } }> => { calls.push({ action: 'sheet', input }); return {}; },
    presentPaymentSheet: async (): Promise<{ error?: { message: string; code?: string } }> => { calls.push({ action: 'present' }); return {}; },
  };
  const links = { scheme: 'exp://local/--/', returnUrl: 'exp://local/--/stripe-redirect' };
  return { sdk, calls, links };
}

test('cartao inicializa SDK com a chave publica de teste e o retorno do Expo', async () => {
  const f = fixture();
  assert.deepEqual(await confirmStripePayment('pi_test_secret', 'pk_test_unit', f.links, f.sdk), { canceled: false });
  assert.deepEqual(f.calls, [
    { action: 'initialize', input: { publishableKey: 'pk_test_unit', urlScheme: f.links.scheme } },
    { action: 'sheet', input: { merchantDisplayName: 'EMPS Charge', paymentIntentClientSecret: 'pi_test_secret', returnURL: f.links.returnUrl } },
    { action: 'present' },
  ]);
});

test('chaves ausentes, privadas ou live nao abrem uma tela de pagamento', async () => {
  const f = fixture();
  for (const key of ['', 'pk_live_unit', 'sk_test_unit']) await assert.rejects(confirmStripePayment('pi_test_secret', key, f.links, f.sdk), /chave pública de teste/);
  assert.equal(f.calls.length, 0);
});

test('cancelar o Stripe e distinto de confirmar; falha de inicializacao nao apresenta a tela', async () => {
  const f = fixture();
  f.sdk.presentPaymentSheet = async () => ({ error: { code: 'Canceled', message: 'canceled' } });
  assert.deepEqual(await confirmStripePayment('pi_test_secret', 'pk_test_unit', f.links, f.sdk), { canceled: true });
  f.sdk.initPaymentSheet = async () => ({ error: { message: 'Falha do provedor' } });
  f.sdk.presentPaymentSheet = async () => { throw new Error('Nao deve apresentar'); };
  await assert.rejects(confirmStripePayment('pi_test_secret', 'pk_test_unit', f.links, f.sdk), /Falha do provedor/);
});
