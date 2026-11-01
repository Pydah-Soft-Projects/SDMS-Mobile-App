import Constants from 'expo-constants';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Resolve environment defined via EAS Build or local .env
const appEnv =
  process.env.EXPO_PUBLIC_APP_ENV ||
  Constants.expoConfig?.extra?.APP_ENV ||
  (__DEV__ ? 'development' : 'production');

// Smart host detection: Extract developer computer IP from Expo hostUri or use known LAN IP
const getAutoDetectedHost = (): string => {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {
    // fallback
  }

  // Developer local LAN IP
  return '192.168.3.117';
};

let rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  (appEnv === 'production' ? 'https://sdms.pydah.edu.in/api' : `http://${getAutoDetectedHost()}:5000/api`);

// On native mobile devices (Android/iOS), "localhost" refers to the phone itself.
// Automatically replace localhost/127.0.0.1 with the machine's local LAN IP so mobile can reach the backend.
if (Platform.OS !== 'web' && (rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1'))) {
  const hostIp = getAutoDetectedHost();
  rawApiUrl = rawApiUrl.replace('localhost', hostIp).replace('127.0.0.1', hostIp);
}

// Clean trailing slash and ensure it ends with /api
const normalizeUrl = (url: string) => {
  const clean = url.trim().replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export let API_BASE_URL = normalizeUrl(rawApiUrl);
export let STATIC_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

// Dynamic switcher for runtime URL adjustments
export const setRuntimeApiUrl = (newUrl: string) => {
  API_BASE_URL = normalizeUrl(newUrl);
  STATIC_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
  logger.info('ENV', `Backend URL changed to: ${API_BASE_URL}`);
};

export const CRM_BACKEND_URL =
  process.env.EXPO_PUBLIC_CRM_BACKEND_URL ||
  Constants.expoConfig?.extra?.CRM_BACKEND_URL ||
  'https://crm.pydah.edu.in';

export const PPG_GATEWAY_URL =
  process.env.EXPO_PUBLIC_GATEWAY_URL ||
  Constants.expoConfig?.extra?.GATEWAY_URL ||
  `${STATIC_BASE_URL}/api/v1`;

export const ENV = {
  get appEnv() {
    return appEnv;
  },
  get apiUrl() {
    return API_BASE_URL;
  },
  get staticUrl() {
    return STATIC_BASE_URL;
  },
  crmUrl: CRM_BACKEND_URL,
  ppgUrl: PPG_GATEWAY_URL,
  isDev: appEnv === 'development',
  isPreview: appEnv === 'preview',
  isProd: appEnv === 'production',
};

logger.info('ENV', `Resolved Target API [${appEnv}] -> ${API_BASE_URL}`);

export default ENV;
