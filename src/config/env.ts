import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve environment defined via EAS Build or local .env
const appEnv =
  process.env.EXPO_PUBLIC_APP_ENV ||
  Constants.expoConfig?.extra?.APP_ENV ||
  (__DEV__ ? 'development' : 'production');

// Default fallback host based on platform for local development
const getDefaultDevApiUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator loops back to host machine via 10.0.2.2
    return 'http://10.0.2.2:5000/api';
  }
  // iOS Simulator & Web access localhost directly
  return 'http://localhost:5000/api';
};

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  getDefaultDevApiUrl();

// Clean trailing slash and ensure it ends with /api
const cleanUrl = rawApiUrl.replace(/\/$/, '');
export const API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

// Server root for static uploads (without /api)
export const STATIC_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

// CRM & SSO Gateway Base URL
export const CRM_BACKEND_URL =
  process.env.EXPO_PUBLIC_CRM_BACKEND_URL ||
  Constants.expoConfig?.extra?.CRM_BACKEND_URL ||
  'https://crm.pydah.edu.in';

// Pydah Payment Gateway Base URL
export const PPG_GATEWAY_URL =
  process.env.EXPO_PUBLIC_GATEWAY_URL ||
  Constants.expoConfig?.extra?.GATEWAY_URL ||
  `${STATIC_BASE_URL}/api/v1`;

export const ENV = {
  appEnv,
  apiUrl: API_BASE_URL,
  staticUrl: STATIC_BASE_URL,
  crmUrl: CRM_BACKEND_URL,
  ppgUrl: PPG_GATEWAY_URL,
  isDev: appEnv === 'development',
  isPreview: appEnv === 'preview',
  isProd: appEnv === 'production',
};

export default ENV;

