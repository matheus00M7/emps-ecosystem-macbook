const CHARGE_ORIGIN = 'https://emps-charge.tech';

export function chargerQrUrl(publicToken: string): string {
  return `${CHARGE_ORIGIN}/charge/${encodeURIComponent(publicToken)}`;
}
