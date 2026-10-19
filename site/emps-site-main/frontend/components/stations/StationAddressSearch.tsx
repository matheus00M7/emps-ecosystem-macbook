'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { addressDraftPatch, searchAddress, type AddressSuggestion } from './station-address-search';
import type { DraftChange } from './station-wizard-model';
import styles from './station-wizard.module.css';

export function StationAddressSearch({countryCode, onChange, disabled = false, onSelect}: {
  countryCode: unknown; onChange: DraftChange; disabled?: boolean; onSelect: () => void;
}) {
  const id = useId();
  const request = useRef<AbortController | null>(null);
  const [query, setQuery] = useState(''), [results, setResults] = useState<AddressSuggestion[]>([]);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => () => {request.current?.abort(); request.current = null;}, []);
  useEffect(() => { if (disabled) {request.current?.abort(); request.current = null; setBusy(false);} }, [disabled]);

  async function search() {
    if (disabled || query.trim().length < 3) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 10_000);
    setBusy(true); setResults([]); setMessage('');
    try {
      const found = await searchAddress(query, countryCode, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;
      setResults(found); setMessage(found.length ? `${found.length} sugestões encontradas. Selecione uma e confira os campos.` : 'Nenhum endereço encontrado. Tente incluir cidade e estado ou preencha manualmente.');
    } catch {
      if (request.current === controller) setMessage('Não foi possível buscar o endereço. Você pode preencher os campos e usar o mapa.');
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setBusy(false);
    }
  }

  function select(address: AddressSuggestion) {
    if (disabled) return;
    onSelect();
    for (const [key, value] of Object.entries(addressDraftPatch(address))) onChange(key, value);
    setResults([]); setMessage('Localização preenchida. Confira endereço, número e posição no mapa antes de salvar.');
  }

  return <div className={styles.addressSearch}>
    <label htmlFor={id}>Buscar endereço</label>
    <div className={styles.addressSearchInput}><input id={id} type="search" value={query} disabled={disabled} maxLength={160}
      placeholder="Rua, número e cidade" aria-describedby={`${id}-hint`} onChange={event => {
        request.current?.abort(); request.current = null; setBusy(false); setQuery(event.target.value); setResults([]); setMessage('');
      }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }}/>
      <button type="button" className={styles.secondary} disabled={disabled || busy || query.trim().length < 3} onClick={() => void search()}><Search size={16}/>{busy ? 'Buscando…' : 'Buscar'}</button>
    </div>
    <small id={`${id}-hint`}>Ao buscar, o endereço é enviado ao serviço Photon / OpenStreetMap. O preenchimento manual continua disponível.</small>
    {message && <p role="status">{message}</p>}
    {!!results.length && <ul aria-label="Sugestões de endereço" className={styles.addressSuggestions}>{results.map(result => <li key={result.id}><button type="button" disabled={disabled} onClick={() => select(result)}>{result.label}</button></li>)}</ul>}
    <small>Dados © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · busca Photon</small>
  </div>;
}
