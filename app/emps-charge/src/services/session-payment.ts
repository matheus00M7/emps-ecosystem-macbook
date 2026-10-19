import type { Charger, ChargingSession } from '../domain/models';
import type { MobileApi } from './mobile-api';

type Dependencies = {
  session: ChargingSession;
  api: Pick<MobileApi, 'disconnectSession' | 'paySession' | 'charger'>;
  refreshHistory: () => Promise<ChargingSession[]>;
  getCharger: (id: string) => Charger | undefined;
  confirm: (secret: string, key?: string) => Promise<{canceled: boolean}>;
  isCurrent: () => boolean;
  wait?: () => Promise<void>;
};

/** A response from an old account must never open PaymentSheet or complete a new account's UI. */
export async function payOwnedSession({session, api, refreshHistory, getCharger, confirm, isCurrent,
  wait = () => new Promise(resolve => setTimeout(resolve, 600))}: Dependencies): Promise<boolean> {
  if (!isCurrent()) return false;
  if (session.status === 'completed') return true;
  if (!session.lifecycle) {
    await api.disconnectSession(session.id);
    if (!isCurrent()) return false;
  }
  await refreshHistory();
  if (!isCurrent()) return false;
  const payment = await api.paySession(session.id);
  if (!isCurrent()) return false;
  if (payment.status === 'pending' && payment.reason === 'BELOW_PROVIDER_MINIMUM') {
    await refreshHistory();
    if (!isCurrent()) return false;
    throw new Error(payment.message ?? 'O valor original permanece pendente, abaixo do mínimo do cartão.');
  }
  if (payment.status === 'requires_action') {
    if (!payment.providerClientSecret) throw new Error('Stripe não retornou os dados para confirmação.');
    const charger = getCharger(session.chargerId) ?? await api.charger(session.chargerId);
    if (!isCurrent()) return false;
    const result = await confirm(payment.providerClientSecret, charger.paymentOptions?.stripePublishableKey);
    if (!isCurrent() || result.canceled) return false;
  }
  for (let i = 0; i < 10; i++) {
    if (!isCurrent()) return false;
    const rows = await refreshHistory();
    if (!isCurrent()) return false;
    if (rows.find(row => row.id === session.id)?.status === 'completed') return true;
    await wait();
  }
  return false;
}
