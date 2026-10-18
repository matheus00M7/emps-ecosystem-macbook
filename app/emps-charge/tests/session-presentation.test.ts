import assert from 'node:assert/strict';
import test from 'node:test';

import type { ChargingSession, SessionStatus } from '../src/domain/models';
import { getSessionPresentation } from '../src/domain/session-presentation';

const session: ChargingSession = {
  id: 'presentation-test', stationId: '13', chargerId: '1',
  startedAt: '2026-10-15T12:00:00Z', status: 'charging', paymentMethod: 'pix',
  spendingLimit: 10, energyKwh: 1, totalCost: 2, powerKw: 7,
  durationSeconds: 600, simulatedSecondsOffset: 0,
};

for (const [status, label, tone] of [
  ['starting', 'Iniciando recarga', 'active'],
  ['charging', 'Carregando', 'active'],
  ['stopping', 'Encerrando recarga', 'active'],
  ['payment_pending', 'Pagamento pendente', 'warning'],
  ['completed', 'Finalizada', 'success'],
] as const) {
  test(`apresenta ${status} sem confundir pendencia com conclusao`, () => {
    assert.deepEqual(getSessionPresentation({ ...session, status }), { label, tone });
  });
}

const lifecycle = {
  version: 'PREPAID_LIMIT_V2', serverTime: '2026-10-15T12:10:00Z',
  stoppedAt: '2026-10-15T12:10:00Z', disconnectedAt: null,
  removalDeadline: '2026-10-15T12:20:00Z', graceSeconds: 600,
  remainingGraceSeconds: 600, occupancyState: 'GRACE', overstaySeconds: 0,
} as const;

test('recibo pago ainda informa retirada pendente quando o conector esta ocupado', () => {
  assert.deepEqual(getSessionPresentation({ ...session, status: 'completed', lifecycle }), {
    label: 'Aguardando retirada', tone: 'warning',
  });
});

test('retirada nao esconde uma pendencia de pagamento', () => {
  assert.equal(getSessionPresentation({ ...session, status: 'payment_pending', lifecycle }).label, 'Pagamento pendente');
});

test('apos retirar o conector, apresenta sessao como finalizada', () => {
  assert.equal(getSessionPresentation({ ...session, status: 'completed', lifecycle: {
    ...lifecycle, disconnectedAt: '2026-10-15T12:15:00Z', occupancyState: 'REMOVED',
  } }).tone, 'success');
});

test('apresentacao nao altera os dados da sessao', () => {
  const input = Object.freeze({ ...session, status: 'starting' as SessionStatus });
  getSessionPresentation(input);
  assert.equal(input.status, 'starting');
  assert.equal(input.totalCost, 2);
});
