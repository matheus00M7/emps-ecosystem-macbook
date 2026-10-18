import type { Charger, Station } from './models';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

export function connectorLabel(value: string) {
  const key = value.toUpperCase().replace(/[\s_-]/g, '');
  if (key === 'TYPE2' || key === 'TIPO2') return 'Tipo 2';
  if (key === 'CCS2') return 'CCS2';
  if (key === 'CHADEMO') return 'CHAdeMO';
  return value;
}

export function filterStations(
  stations: Station[],
  chargers: Charger[],
  filters: {
    query: string;
    connector: string;
    availableOnly: boolean;
  },
) {
  const query = normalize(filters.query.trim());
  return stations.filter((station) => {
    if (
      !normalize(
        [station.name, station.address, station.neighborhood, station.city].join(' '),
      ).includes(query)
    )
      return false;
    const compatible = chargers.filter(
      (charger) =>
        charger.stationId === station.id &&
        (filters.connector === 'Todos' ||
          connectorLabel(charger.connectorType) === filters.connector),
    );
    if (filters.connector !== 'Todos' && !compatible.length) return false;
    return (
      !filters.availableOnly ||
      (station.availableNow !== false &&
        compatible.some((charger) => charger.status === 'available'))
    );
  });
}
