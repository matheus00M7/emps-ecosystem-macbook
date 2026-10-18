import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { useApp } from '@/context/app-context';

type Preferences = { mapTheme: 'dark' | 'light'; vibration: boolean };
const defaults: Preferences = { mapTheme: 'dark', vibration: true };
const PreferencesContext = createContext<{
  preferences: Preferences;
  ready: boolean;
  error: string;
  update: (next: Partial<Preferences>) => void;
} | null>(null);

function UserPreferences({ userId, children }: PropsWithChildren<{ userId: string }>) {
  const key = `emps:preferences:v1:${userId}`;
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active || !raw) return;
        const saved: unknown = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          const data = saved as Partial<Preferences>;
          setPreferences({
            mapTheme: data.mapTheme === 'light' ? 'light' : 'dark',
            vibration: typeof data.vibration === 'boolean' ? data.vibration : true,
          });
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível recuperar suas preferências.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void AsyncStorage.setItem(key, JSON.stringify(preferences)).catch(() => {
      if (active) setError('Esta preferência não pôde ser salva neste aparelho.');
    });
    return () => {
      active = false;
    };
  }, [key, preferences, ready]);
  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        ready,
        error,
        update: (next) => {
          setError('');
          setPreferences((current) => ({ ...current, ...next }));
        },
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const { user } = useApp();
  const userId = user?.id ?? 'guest';
  return (
    <UserPreferences key={userId} userId={userId}>
      {children}
    </UserPreferences>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('PreferencesProvider is required.');
  return value;
}
