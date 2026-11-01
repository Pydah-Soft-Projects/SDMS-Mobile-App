import Constants from 'expo-constants';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Resolve environment defined via EAS Build or local .env
const appEnv =
  process.env.EXPO_PUBLIC_APP_ENV ||
  Constants.expoConfig?.extra?.APP_ENV ||
  (__DEV__ ? 'development' : 'production');

// Smart host detection: Extract developer computer IP from Expo hostUri (e.g. 192.168.1.5:8081)
const getAutoDetectedHost = (): string => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000/api`;
      }
    }
  } catch {
    // fallback
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const defaultDevUrl = getAutoDetectedHost();

let resolvedApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  defaultDevUrl;

// Clean trailing slash and ensure it ends with /api
const normalizeUrl = (url: string) => {
  const clean = url.trim().replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export let API_BASE_URL = normalizeUrl(resolvedApiUrl);
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

logger.info('ENV', `Initialized environment [${appEnv}] -> API: ${API_BASE_URL}`);

export default ENV;
