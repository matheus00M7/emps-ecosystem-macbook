import type { Charger, ChargingSession } from '../domain/models';
import { demoPayment } from '../domain/checkout';
import { currency } from './receipt-html';
import { receiptDocumentPdf } from './receipt-pdf';

export function demoAuthorizationRows(
  session: ChargingSession, station: string, charger: Charger, demoMode = false,
) {
  if (session.chargerId !== charger.id || session.stationId !== charger.stationId ||
    session.paymentMethod === 'card' || !demoPayment(charger.paymentOptions, session.paymentMethod, demoMode)) {
    throw new Error('Este comprovante é exclusivo de Pix ou carteira em demonstração.');
  }
  if (!['starting', 'charging', 'stopping'].includes(session.status) ||
    !session.id || !Number.isFinite(Date.parse(session.startedAt)) ||
    session.spendingLimit === null || !Number.isFinite(session.spendingLimit) || session.spendingLimit < 1) {
    throw new Error('Aguarde a confirmação da sessão para gerar a autorização de teste.');
  }
  return [
    ['Sessão', session.id], ['Instalação', station], ['Carregador', charger.bay],
    ['Método', session.paymentMethod === 'pix' ? 'Pix Demo' : 'Apple Pay / Google Pay Demo'],
    ['Status', 'Autorizado para teste'],
    ['Início da sessão', new Date(session.startedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })],
    ['Limite da recarga', currency(String(session.spendingLimit))],
    ['Movimentação bancária', 'Nenhuma - pagamento fictício'],
  ];
}

export async function paymentAuthorizationPdf(
  session: ChargingSession, station: string, charger: Charger, logo: Uint8Array, demoMode = false,
) {
  const rows = demoAuthorizationRows(session, station, charger, demoMode);
  return receiptDocumentPdf(rows, logo, {
    title: 'Comprovante de teste',
    metadataTitle: 'EMPS - Autorizacao Demo - ' + session.id,
    subtitle: 'DEMONSTRACAO - SEM VALOR BANCARIO',
    totalLabel: 'Valor autorizado',
    total: currency(String(session.spendingLimit)),
    notes: [
      'Autorização fictícia. Não comprova transferência bancária nem liquidação real.',
      'O consumo final e o comprovante da recarga ficam disponíveis no histórico.',
      'Não substitui documento fiscal. Horários de Brasília.',
    ],
  });
}
