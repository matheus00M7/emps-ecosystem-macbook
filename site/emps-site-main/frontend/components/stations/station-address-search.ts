export type AddressSuggestion = {
  id: string; label: string; latitude: number; longitude: number;
  street?: string; addressNumber?: string; city?: string; state?: string;
  postalCode?: string; neighborhood?: string; complement?: string; countryCode?: string;
};

export function addressDraftPatch(address: AddressSuggestion): Record<string, unknown> {
  const fields = ['street', 'addressNumber', 'city', 'state', 'postalCode', 'neighborhood', 'complement'] as const;
  return {
    ...Object.fromEntries(fields.map(field => [field, address[field] ?? ''])),
    latitude: address.latitude, longitude: address.longitude,
    ...(address.countryCode ? {countryCode: address.countryCode} : {}),
  };
}

const states: Record<string, string> = {
  Acre:'AC', Alagoas:'AL', Amapá:'AP', Amazonas:'AM', Bahia:'BA', Ceará:'CE',
  'Distrito Federal':'DF', 'Espírito Santo':'ES', Goiás:'GO', Maranhão:'MA',
  'Mato Grosso':'MT', 'Mato Grosso do Sul':'MS', 'Minas Gerais':'MG', Pará:'PA',
  Paraíba:'PB', Paraná:'PR', Pernambuco:'PE', Piauí:'PI', 'Rio de Janeiro':'RJ',
  'Rio Grande do Norte':'RN', 'Rio Grande do Sul':'RS', Rondônia:'RO', Roraima:'RR',
  'Santa Catarina':'SC', 'São Paulo':'SP', Sergipe:'SE', Tocantins:'TO',
};
const text = (value: unknown, max = 80) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, max) : undefined;

export function addressSuggestions(payload: unknown): AddressSuggestion[] {
  const features = (payload as {features?: unknown[]})?.features;
  if (!Array.isArray(features)) return [];
  const results = new Map<string, AddressSuggestion>();
  for (const feature of features.slice(0, 20)) {
    const row = feature as {geometry?: {type?: string; coordinates?: unknown[]}; properties?: Record<string, unknown>};
    const coordinates = row?.geometry?.coordinates, p = row?.properties;
    if (!p || row.geometry?.type !== 'Point' || !Array.isArray(coordinates)) continue;
    const [longitude, latitude] = coordinates;
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;
    const rawCountryCode = text(p.countrycode);
    const countryCode = rawCountryCode && /^[a-z]{2}$/i.test(rawCountryCode) ? rawCountryCode.toUpperCase() : undefined;
    const stateName = text(p.state), state = countryCode === 'BR'
      ? states[stateName ?? ''] ?? (/^[A-Z]{2}$/.test(stateName ?? '') ? stateName : undefined) : stateName;
    const street = text(p.street), city = text(p.city) ?? text(p.locality) ?? text(p.county);
    const addressNumber = text(p.housenumber, 20);
    const label = [text(p.name), [street, addressNumber].filter(Boolean).join(', '), city, state, text(p.country)].filter(Boolean).join(' · ');
    if (!label) continue;
    const id = `${latitude}:${longitude}:${label}`;
    results.set(id, {id, label, latitude, longitude, street, addressNumber, city, state,
      postalCode: countryCode === 'BR' && /^\d{5}-?\d{3}$/.test(text(p.postcode, 9) ?? '') ? String(p.postcode).replace(/\D/g, '') : undefined,
      neighborhood: text(p.district), countryCode});
  }
  return [...results.values()].slice(0, 5);
}

export async function searchAddress(query: string, countryCode: unknown, signal: AbortSignal): Promise<AddressSuggestion[]> {
  const url = new URL(process.env.NEXT_PUBLIC_EMPS_GEOCODER_URL || 'https://photon.komoot.io/api/');
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Serviço de endereços inválido.');
  url.searchParams.set('q', query.trim().slice(0, 160));
  url.searchParams.set('limit', '5');
  if (typeof countryCode === 'string' && /^[a-z]{2}$/i.test(countryCode)) url.searchParams.set('countrycode', countryCode.toUpperCase());
  const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('A busca está indisponível. Preencha o endereço manualmente.');
  return addressSuggestions(await response.json());
}
