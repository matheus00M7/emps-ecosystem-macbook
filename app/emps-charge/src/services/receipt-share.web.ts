import { Asset } from 'expo-asset';
import type { Charger, ChargingSession } from '../domain/models';
import { receiptPdf } from './receipt-pdf';
import { paymentAuthorizationPdf } from './payment-authorization-pdf';

export async function shareReceiptPdf(session: ChargingSession, station: string, charger: string) {
  return shareDocument(logo => receiptPdf(session, station, charger, logo), 'EMPS-comprovante-'+session.id);
}

export async function sharePaymentAuthorizationPdf(session: ChargingSession, station: string, charger: Charger, demoMode = false) {
  return shareDocument(logo => paymentAuthorizationPdf(session, station, charger, logo, demoMode), 'EMPS-autorizacao-demo-'+session.id);
}

async function shareDocument(render: (logo: Uint8Array) => Promise<Uint8Array>, name: string) {
  const asset = Asset.fromModule(require('../../assets/images/emps-logo-red.png'));
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Não foi possível carregar a logo EMPS. Tente novamente.');
  const bytes = await render(new Uint8Array(await response.arrayBuffer()));
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
  const link = document.createElement('a');
  link.href=url;
  link.download=name.replace(/[^a-zA-Z0-9_-]/g,'')+'.pdf';
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); setTimeout(()=>URL.revokeObjectURL(url),60_000); }
}
