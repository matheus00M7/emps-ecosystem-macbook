import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChargingSession } from '../src/domain/models';
import { filterHistory, type HistoryFilters } from '../src/domain/history-filters';

const base: ChargingSession = {
  id: '123',
  stationId: '13',
  chargerId: '1',
  status: 'completed',
  paymentMethod: 'pix',
  startedAt: new Date(2026, 9, 15, 10).toISOString(),
  spendingLimit: 10,
  energyKwh: 1,
  totalCost: 2,
  powerKw: 7,
  durationSeconds: 600,
  simulatedSecondsOffset: 0,
};
const now = new Date(2026, 9, 15, 12);
const all: HistoryFilters = { query: '', period: 'all', status: 'all' };
const stationName = () => 'Estação Consolação';
const filter = (sessions: ChargingSession[], filters: Partial<HistoryFilters>) =>
  filterHistory(sessions, { ...all, ...filters }, stationName, now);

test('busca por ID e nome sem diferenciar acentos ou caixa', () => {
  assert.equal(filter([base], { query: '123' }).length, 1);
  assert.equal(filter([base], { query: 'CONSOLACAO' }).length, 1);
  assert.equal(filter([base], { query: 'inexistente' }).length, 0);
});
test('sete dias inclui o primeiro dia desde meia-noite local', () => {
  const first = { ...base, id: 'first', startedAt: new Date(2026, 9, 9).toISOString() };
  const before = { ...base, id: 'before', startedAt: new Date(2026, 9, 8, 23, 59).toISOString() };
  assert.deepEqual(
    filter([before, first, base], { period: 'week' }).map((item) => item.id),
    ['123', 'first'],
  );
});
test('mes respeita virada de mes e nao inclui registros futuros', () => {
  const first = { ...base, id: 'first', startedAt: new Date(2026, 9, 1).toISOString() };
  const before = { ...base, startedAt: new Date(2026, 8, 30, 23, 59).toISOString() };
  const future = { ...base, startedAt: new Date(2026, 9, 16).toISOString() };
  assert.deepEqual(
    filter([before, future, first], { period: 'month' }).map((item) => item.id),
    ['first'],
  );
});
test('pagamento pendente nao aparece como finalizada', () => {
  const pending: ChargingSession = { ...base, id: 'pending', status: 'payment_pending' };
  assert.deepEqual(
    filter([pending, base], { status: 'completed' }).map((item) => item.id),
    ['123'],
  );
  assert.deepEqual(
    filter([pending, base], { status: 'pending' }).map((item) => item.id),
    ['pending'],
  );
});
test('conector aguardando retirada permanece nas pendencias', () => {
  const pending: ChargingSession = {
    ...base,
    lifecycle: {
      version: 'PREPAID_LIMIT_V2',
      serverTime: now.toISOString(),
      stoppedAt: now.toISOString(),
      disconnectedAt: null,
      removalDeadline: now.toISOString(),
      graceSeconds: 600,
      remainingGraceSeconds: 600,
      occupancyState: 'GRACE',
      overstaySeconds: 0,
    },
  };
  assert.equal(filter([pending], { status: 'pending' }).length, 1);
  assert.equal(filter([pending], { status: 'completed' }).length, 0);
});
test('filtro nao altera registros nem a ordem recebida', () => {
  const older = Object.freeze({
    ...base,
    id: 'older',
    startedAt: new Date(2026, 8, 1).toISOString(),
  });
  const sessions = [older, Object.freeze(base)];
  assert.equal(filter(sessions, {}).length, 2);
  assert.equal(sessions[0].id, 'older');
  assert.equal(base.totalCost, 2);
});
