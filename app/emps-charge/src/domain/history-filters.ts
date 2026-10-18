import type { ChargingSession } from './models';
import { getSessionPresentation } from './session-presentation';

export type HistoryPeriod = 'all' | 'month' | 'week';
export type HistoryStatus = 'all' | 'completed' | 'pending';
export type HistoryFilters = { query: string; period: HistoryPeriod; status: HistoryStatus };
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

export function filterHistory(
  sessions: ChargingSession[],
  filters: HistoryFilters,
  stationName: (id: string) => string,
  now = new Date(),
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (filters.period === 'month') start.setDate(1);
  if (filters.period === 'week') start.setDate(start.getDate() - 6);
  const query = normalize(filters.query.trim());
  return sessions
    .filter((session) => {
      const time = new Date(session.startedAt).getTime();
      if (
        filters.period !== 'all' &&
        (!Number.isFinite(time) || time < start.getTime() || time > now.getTime())
      )
        return false;
      const tone = getSessionPresentation(session).tone;
      if (filters.status === 'completed' && tone !== 'success') return false;
      if (filters.status === 'pending' && tone !== 'warning') return false;
      return normalize(
        [session.id, session.chargerId, stationName(session.stationId)].join(' '),
      ).includes(query);
    })
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}
