import { decryptString, encryptString } from '@/lib/security/encryption';
import type {
  DecryptedHttpConnectorInstanceConfig,
  HttpConnectorInstanceConfig,
} from './http.types';

export function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function joinUrl(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function createHttpConnectorConfig(input: {
  baseUrl: string;
  auth:
    | { type: 'none' }
    | { type: 'api_key'; headerName: string; apiKey: string }
    | { type: 'bearer_token'; token: string }
    | { type: 'basic'; username: string; password: string };
}): HttpConnectorInstanceConfig {
  const baseUrl = normalizeBaseUrl(input.baseUrl);

  if (input.auth.type === 'none') {
    return { baseUrl, auth: { type: 'none' } };
  }

  if (input.auth.type === 'api_key') {
    const apiKeyLast4 = input.auth.apiKey.slice(-4);
    return {
      baseUrl,
      auth: {
        type: 'api_key',
        headerName: input.auth.headerName,
        encryptedApiKey: encryptString(input.auth.apiKey),
        apiKeyLast4,
      },
    };
  }

  if (input.auth.type === 'bearer_token') {
    const tokenLast4 = input.auth.token.slice(-4);
    return {
      baseUrl,
      auth: {
        type: 'bearer_token',
        encryptedToken: encryptString(input.auth.token),
        tokenLast4,
      },
    };
  }

  const passwordLast4 = input.auth.password.slice(-4);
  return {
    baseUrl,
    auth: {
      type: 'basic',
      username: input.auth.username,
      encryptedPassword: encryptString(input.auth.password),
      passwordLast4,
    },
  };
}

export function decryptHttpConnectorConfig(
  config: HttpConnectorInstanceConfig
): DecryptedHttpConnectorInstanceConfig {
  const auth = config.auth;

  if (auth.type === 'none') {
    return { baseUrl: config.baseUrl, auth: { type: 'none' } };
  }

  if (auth.type === 'api_key') {
    return {
      baseUrl: config.baseUrl,
      auth: {
        type: 'api_key',
        headerName: auth.headerName,
        apiKey: decryptString(auth.encryptedApiKey),
        apiKeyLast4: auth.apiKeyLast4,
      },
    };
  }

  if (auth.type === 'bearer_token') {
    return {
      baseUrl: config.baseUrl,
      auth: {
        type: 'bearer_token',
        token: decryptString(auth.encryptedToken),
        tokenLast4: auth.tokenLast4,
      },
    };
  }

  return {
    baseUrl: config.baseUrl,
    auth: {
      type: 'basic',
      username: auth.username,
      password: decryptString(auth.encryptedPassword),
      passwordLast4: auth.passwordLast4,
    },
  };
}

export function getAuthHeaders(
  config: DecryptedHttpConnectorInstanceConfig
): Record<string, string> {
  const auth = config.auth;

  if (auth.type === 'none') return {};

  if (auth.type === 'api_key') {
    return {
      [auth.headerName]: auth.apiKey,
    };
  }

  if (auth.type === 'bearer_token') {
    return {
      Authorization: `Bearer ${auth.token}`,
    };
  }

  const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString(
    'base64'
  );

  return {
    Authorization: `Basic ${credentials}`,
  };
}
