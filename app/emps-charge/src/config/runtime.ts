import { Platform } from 'react-native';

export const EMPS_DEMO_MODE = process.env.EXPO_PUBLIC_EMPS_DEMO_MODE === 'true';
export const EMPS_REALTIME_URL = process.env.EXPO_PUBLIC_EMPS_API_URL?.trim() ?? '';
export const EMPS_WEB_READONLY_PREVIEW = __DEV__ && Platform.OS === 'web' &&
  process.env.EXPO_PUBLIC_EMPS_WEB_READONLY_PREVIEW === 'true';
export const EMPS_API_URL = EMPS_WEB_READONLY_PREVIEW
  ? 'http://127.0.0.1:8082' : EMPS_REALTIME_URL;
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';
