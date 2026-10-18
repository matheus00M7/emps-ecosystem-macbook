import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import type { Charger, ChargingSession } from '../src/domain/models';
import { demoAuthorizationRows, paymentAuthorizationPdf } from '../src/services/payment-authorization-pdf';

const charger = {
  id: 'demo-charger', stationId: 'demo-station', bay: 'Vaga de demonstracao',
  paymentOptions: { paymentProvider: 'stripe', demoPayments: true },
} as Charger;
const session = {
  id: 'DEMO-EXEMPLO-001', chargerId: charger.id, stationId: charger.stationId,
  startedAt: '2026-10-16T18:00:00Z', status: 'charging', paymentMethod: 'pix',
  spendingLimit: 20,
} as ChargingSession;

test('PDF da autorizacao e demonstrativo e usa valor e identificadores da sessao', async () => {
  const rows = demoAuthorizationRows(session, 'Instalacao de exemplo', charger);
  assert.equal(rows.find(([label]) => label === 'Sessão')?.[1], session.id);
  assert.match(rows.find(([label]) => label === 'Limite da recarga')?.[1] ?? '', /20,00/);
  assert.match(rows.find(([label]) => label === 'Movimentação bancária')?.[1] ?? '', /Nenhuma/);
  const bytes = await paymentAuthorizationPdf(session, 'Instalacao de exemplo', charger, readFileSync('assets/images/emps-logo-red.png'));
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.match(pdf.getTitle() ?? '', /Autorizacao Demo/);
  assert.equal(pdf.getAuthor(), 'EMPS');
  if (process.env.EMPS_AUTHORIZATION_PDF_PREVIEW) writeFileSync(process.env.EMPS_AUTHORIZATION_PDF_PREVIEW, bytes);
});

test('autorizacao nao representa cartao, outra vaga, dados ausentes ou pendencia como pagamento', () => {
  for (const change of [
    { paymentMethod: 'card' as const }, { chargerId: 'other' }, { stationId: 'other' },
    { status: 'payment_pending' as const }, { spendingLimit: null }, { spendingLimit: Number.NaN },
    { startedAt: 'invalid' },
  ]) assert.throws(() => demoAuthorizationRows({ ...session, ...change }, 'A', charger));
  assert.throws(() => demoAuthorizationRows(session, 'A', { ...charger, paymentOptions: { paymentProvider: 'stripe', demoPayments: false } }));
});

test('carteira Demo aparece como simulacao e textos longos continuam no PDF', async () => {
  const wallet = { ...session, paymentMethod: 'wallet' as const };
  const rows = demoAuthorizationRows(wallet, 'Teste', charger);
  assert.match(rows.find(([label]) => label === 'Método')?.[1] ?? '', /Apple Pay.*Demo/);
  const bytes = await paymentAuthorizationPdf(wallet, 'Instalacao '.repeat(800), charger, readFileSync('assets/images/emps-logo-red.png'));
  assert.ok((await PDFDocument.load(bytes)).getPageCount() > 1);
});
