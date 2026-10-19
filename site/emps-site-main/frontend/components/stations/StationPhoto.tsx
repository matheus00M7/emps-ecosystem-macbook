'use client';

import {useEffect, useState} from 'react';
import {ImageIcon} from 'lucide-react';
import {api, empsApiUrl, EMPS_SESSION_CHANGED_EVENT, frontSession} from '@/services/emps-api';
import styles from './platform.module.css';

export function StationPhoto({id, alt, version, publicPhoto = false}: {
  id?: string; alt: string; version?: string; publicPhoto?: boolean;
}) {
  const [identity, setIdentity] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const authIdentity = publicPhoto ? 'public' : identity;
  const key = `${authIdentity}:${id}:${version}:${attempt}`;
  const [resolved, setResolved] = useState<{key: string; url?: string; error?: string} | null>(null);
  useEffect(() => {
    const update = () => setIdentity(frontSession.get()?.usuarioId ?? '');
    update(); window.addEventListener(EMPS_SESSION_CHANGED_EVENT, update);
    return () => window.removeEventListener(EMPS_SESSION_CHANGED_EVENT, update);
  }, []);
  useEffect(() => {
    if (!id || (!publicPhoto && !authIdentity)) return;
    const controller = new AbortController();
    let objectUrl = '';
    const timeout = setTimeout(() => {
      controller.abort('photo-timeout');
      setResolved({key, error:'A foto demorou a responder. Tente novamente.'});
    }, 15_000);
    void (async () => {
      const session = publicPhoto ? null : await api.ensureSession();
      if (controller.signal.aborted) return;
      const response = await fetch(`${empsApiUrl}/${publicPhoto ? 'public' : 'v2'}/station-photos/${encodeURIComponent(id)}`, {
        signal: controller.signal, cache: 'no-store', credentials: 'omit',
        headers: session ? {Authorization: `Bearer ${session.token}`} : {},
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Entre novamente para ver esta foto.'
        : response.status === 403 ? 'Sua conta não tem acesso a esta foto.'
        : response.status === 404 ? 'Foto não encontrada.' : 'Não foi possível carregar a foto.');
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setResolved({key, url: objectUrl});
    })().catch(error => {
      if (!controller.signal.aborted || controller.signal.reason === 'photo-timeout') {
        setResolved({key, error: controller.signal.reason === 'photo-timeout' ? 'A foto demorou a responder. Tente novamente.' : error instanceof Error ? error.message : 'Foto indisponível.'});
      }
    }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, authIdentity, publicPhoto, key]);
  const current = resolved?.key === key ? resolved : null;
  const needsLogin = !publicPhoto && identity === '';
  return <div className={styles.photo} aria-busy={!!id && !current && !needsLogin}>
    {current?.url ? <img src={current.url} alt={alt} onError={() => setResolved(value => value?.key === key ? {key, error: 'Não foi possível exibir a foto.'} : value)}/>
      : <div role="status"><ImageIcon size={32} aria-hidden="true"/>
        <span>{!id ? 'Sem foto' : needsLogin ? 'Entre com sua conta para ver a foto.' : current?.error ?? 'Carregando foto…'}</span>
        {current?.error && <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}
      </div>}
  </div>;
}
