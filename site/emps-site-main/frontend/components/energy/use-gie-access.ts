'use client';

import { useEffect, useState } from 'react';
import { EMPS_SESSION_CHANGED_EVENT, frontSession } from '@/services/emps-api';
import { canAccessGie } from '@/domain/gie-access';

export function useGieAccess() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => setAllowed(canAccessGie(frontSession.get()?.email));
    update();
    window.addEventListener(EMPS_SESSION_CHANGED_EVENT, update);
    return () => window.removeEventListener(EMPS_SESSION_CHANGED_EVENT, update);
  }, []);
  return allowed;
}
