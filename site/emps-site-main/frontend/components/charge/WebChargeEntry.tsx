'use client';

import {useSyncExternalStore} from 'react';
import {EMPS_SESSION_CHANGED_EVENT, frontSession} from '@/services/emps-api';
import {WebCharge} from './WebCharge';

function subscribe(change: () => void) {
  window.addEventListener(EMPS_SESSION_CHANGED_EVENT, change);
  return () => window.removeEventListener(EMPS_SESSION_CHANGED_EVENT, change);
}
const accountId = () => frontSession.get()?.usuarioId ?? '';
const serverAccountId = () => '';

export function WebChargeEntry({token}: {token: string}) {
  const owner = useSyncExternalStore(subscribe, accountId, serverAccountId);
  // Reset private UI/Stripe state on QR or account changes, not on token refresh.
  return <WebCharge key={JSON.stringify([token, owner])} token={token}/>;
}
