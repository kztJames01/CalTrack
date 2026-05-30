import * as SecureStore from 'expo-secure-store';
import { getCached, setCached } from './cache';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const GET_CACHE_TTL: Record<string, number> = {
  '/nutrition/search': 300,
  '/nutrition/barcode': 600,
  '/meals/daily': 120,
};

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiRequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  _retry?: boolean;
};

type ApiResponse<T> = {
  data: T;
  status: number;
};

class ApiError extends Error {
  response?: { status: number; data: any };
  config?: ApiRequestConfig;

  constructor(message: string, response?: { status: number; data: any }, config?: ApiRequestConfig) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.config = config;
  }
}

function buildUrl(path: string, params?: ApiRequestConfig['params']): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function doFetch<T>(
  method: ApiMethod,
  path: string,
  data?: unknown,
  config: ApiRequestConfig = {},
  accessTokenOverride?: string,
): Promise<ApiResponse<T>> {
  const token = accessTokenOverride ?? (await SecureStore.getItemAsync('access_token'));
  const headers: Record<string, string> = {
    ...(config.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  if (!isFormData && data !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeout = config.timeout ?? 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(buildUrl(path, config.params), {
      method,
      headers,
      body: data === undefined ? undefined : isFormData ? (data as FormData) : JSON.stringify(data),
      signal: controller.signal,
    });

    const responseData = await parseResponse(response);
    if (!response.ok) {
      const message = responseData?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, { status: response.status, data: responseData }, config);
    }

    return {
      data: responseData as T,
      status: response.status,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.name === 'AbortError') {
      throw new ApiError('Request timeout', undefined, config);
    }
    throw new ApiError(error?.message || 'Network request failed', undefined, config);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request<T>(
  method: ApiMethod,
  path: string,
  data?: unknown,
  config: ApiRequestConfig = {},
): Promise<ApiResponse<T>> {
  try {
    return await doFetch<T>(method, path, data, config);
  } catch (error: any) {
    const isUnauthorized = error?.response?.status === 401;
    const isRefreshCall = path === '/auth/refresh';
    if (isUnauthorized && !config._retry && !isRefreshCall) {
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await doFetch<{ accessToken: string; refreshToken?: string }>(
          'POST',
          '/auth/refresh',
          { refreshToken },
          {},
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
        await SecureStore.setItemAsync('access_token', accessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refresh_token', newRefreshToken);
        }

        return await doFetch<T>(method, path, data, { ...config, _retry: true }, accessToken);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        if ((global as any).eventEmitter) {
          (global as any).eventEmitter.emit('auth:logout');
        }
        throw refreshError;
      }
    }

    throw error;
  }
}

export const apiClient = {
  get: async <T = any>(path: string, config?: ApiRequestConfig) => {
    const cacheTtl = GET_CACHE_TTL[path.split('?')[0]];
    const cacheKey = path + JSON.stringify(config?.params || {});
    if (cacheTtl) {
      const hit = await getCached<T>(cacheKey);
      if (hit) return { data: hit, status: 200 };
    }
    const res = await request<T>('GET', path, undefined, config);
    if (cacheTtl) {
      await setCached(cacheKey, res.data, cacheTtl);
    }
    return res;
  },
  post: <T = any>(path: string, data?: unknown, config?: ApiRequestConfig) =>
    request<T>('POST', path, data, config),
  put: <T = any>(path: string, data?: unknown, config?: ApiRequestConfig) =>
    request<T>('PUT', path, data, config),
  delete: <T = any>(path: string, config?: ApiRequestConfig) =>
    request<T>('DELETE', path, undefined, config),
};
