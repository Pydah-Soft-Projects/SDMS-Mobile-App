import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STATIC_BASE_URL } from './env';
import logger from '../utils/logger';

export const STORAGE_KEYS = {
  TOKEN: 'pydah_auth_token',
  USER: 'pydah_auth_user',
  USER_TYPE: 'pydah_auth_user_type',
};

// Create configured Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Broadcast listener callback for session expiry
type SessionExpiryListener = () => void;
let onSessionExpiry: SessionExpiryListener | null = null;

export const setSessionExpiryHandler = (handler: SessionExpiryListener) => {
  onSessionExpiry = handler;
};

// Request Interceptor: Attach JWT bearer token & log outgoing call
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Keep baseURL synchronized with any runtime change
    config.baseURL = API_BASE_URL;

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      logger.warn('API', 'Failed to retrieve auth token for request', e);
    }

    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    logger.apiReq(config.method || 'GET', fullUrl, config.data);

    return config;
  },
  (error) => {
    logger.error('API', 'Request preparation error', error.message);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors and 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    logger.apiRes(response.status, fullUrl, response.data);
    return response;
  },
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      logger.warn('API', 'Request canceled', error.message);
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    const errData = error.response?.data as any;
    const errMsg = errData?.message || errData?.error || error.message || 'Network Error';

    logger.apiErr(fullUrl, `HTTP ${status || 'ERR'}: ${errMsg}`, {
      status,
      data: errData,
      networkError: !error.response,
    });

    // Ignore 401 for explicit login attempts
    const isLoginEndpoint =
      fullUrl.includes('/login') ||
      fullUrl.includes('/unified-login') ||
      fullUrl.includes('/otp/verify') ||
      fullUrl.includes('/sso-session');

    if (status === 401 && !isLoginEndpoint) {
      logger.warn('AUTH', 'Session expired (401) - clearing credentials');
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.USER_TYPE,
        ]);
        if (onSessionExpiry) {
          onSessionExpiry();
        }
      } catch (e) {
        logger.error('AUTH', 'Error clearing session storage', e);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to resolve static file/upload URLs
export const getStaticFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  if (cleanPath.startsWith('uploads/')) {
    return `${STATIC_BASE_URL}/${cleanPath}`;
  }
  return `${STATIC_BASE_URL}/uploads/${cleanPath}`;
};

export default api;
