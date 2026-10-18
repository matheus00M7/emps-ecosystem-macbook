import assert from 'node:assert/strict';
import test from 'node:test';
import type { Charger, Station } from '../src/domain/models';
import { connectorLabel, filterStations } from '../src/domain/station-filters';

const station: Station = {
  id: 'test-station',
  name: 'Estação Consolação',
  address: 'Rua de teste',
  neighborhood: 'Consolação',
  city: 'São Paulo',
  coordinates: { latitude: -23.5, longitude: -46.6 },
  openingHours: '24h',
  amenities: [],
  chargerIds: ['test-charger'],
};
const charger: Charger = {
  id: 'test-charger',
  stationId: station.id,
  publicCode: 'test',
  qrToken: 'test',
  label: 'Carregador',
  bay: '01',
  // The existing API mapper can return the backend enum without translation.
  connectorType: 'TYPE2' as Charger['connectorType'],
  powerKw: 7.4,
  pricePerKwh: 2,
  status: 'available',
  lastUpdatedAt: '2026-10-16T10:00:00Z',
};
const filters = { query: '', connector: 'Tipo 2', availableOnly: false };

test('normaliza tipos reais da API sem converter conectores desconhecidos', () => {
  for (const type of ['TYPE2', 'TYPE_2', 'type 2', 'Tipo 2'])
    assert.equal(connectorLabel(type), 'Tipo 2');
  assert.equal(connectorLabel('ccs2'), 'CCS2');
  assert.equal(connectorLabel('CHADEMO'), 'CHAdeMO');
  assert.equal(connectorLabel('UNKNOWN'), 'UNKNOWN');
});
test('filtro Tipo 2 encontra TYPE2 e busca sem acentos', () => {
  assert.equal(filterStations([station], [charger], { ...filters, query: 'consolacao' }).length, 1);
  assert.equal(filterStations([station], [charger], { ...filters, connector: 'CCS2' }).length, 0);
});
test('disponibilidade considera apenas o conector filtrado', () => {
  const busy: Charger = { ...charger, status: 'in_use' };
  const ccs: Charger = { ...charger, id: 'second', connectorType: 'CCS2' };
  assert.equal(
    filterStations([station], [busy, ccs], { ...filters, availableOnly: true }).length,
    0,
  );
  assert.equal(
    filterStations([station], [busy, ccs], { ...filters, connector: 'Todos', availableOnly: true })
      .length,
    1,
  );
});
test('estacao fora de horario e disponibilidade desconhecida nao passam filtro de livres', () => {
  assert.equal(
    filterStations([{ ...station, availableNow: false }], [charger], {
      ...filters,
      availableOnly: true,
    }).length,
    0,
  );
  assert.equal(
    filterStations([station], [], { ...filters, connector: 'Todos', availableOnly: true }).length,
    0,
  );
  assert.equal(filterStations([station], [], { ...filters, connector: 'Todos' }).length, 1);
});
