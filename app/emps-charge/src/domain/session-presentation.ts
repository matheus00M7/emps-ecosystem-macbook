import { requiresConnectorRemoval } from './charge-lifecycle';
import type { ChargingSession, SessionStatus } from './models';

type SessionPresentation = {
  label: string;
  tone: 'active' | 'warning' | 'success';
};

const statusPresentation: Record<SessionStatus, SessionPresentation> = {
  starting: { label: 'Iniciando recarga', tone: 'active' },
  charging: { label: 'Carregando', tone: 'active' },
  stopping: { label: 'Encerrando recarga', tone: 'active' },
  payment_pending: { label: 'Pagamento pendente', tone: 'warning' },
  completed: { label: 'Finalizada', tone: 'success' },
};

export function getSessionPresentation(session: ChargingSession): SessionPresentation {
  if (session.status === 'completed' && requiresConnectorRemoval(session)) {
    return { label: 'Aguardando retirada', tone: 'warning' };
  }
  return statusPresentation[session.status];
}
