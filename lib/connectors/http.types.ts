import type { EncryptedPayload } from '@/lib/security/encryption';

export type HttpConnectorAuthConfig =
  | {
      type: 'none';
    }
  | {
      type: 'api_key';
      headerName: string;
      encryptedApiKey: EncryptedPayload;
      apiKeyLast4: string;
    }
  | {
      type: 'bearer_token';
      encryptedToken: EncryptedPayload;
      tokenLast4: string;
    }
  | {
      type: 'basic';
      username: string;
      encryptedPassword: EncryptedPayload;
      passwordLast4: string;
    };

export type HttpConnectorInstanceConfig = {
  baseUrl: string;
  auth: HttpConnectorAuthConfig;
};

export type DecryptedHttpConnectorAuthConfig =
  | { type: 'none' }
  | { type: 'api_key'; headerName: string; apiKey: string; apiKeyLast4: string }
  | { type: 'bearer_token'; token: string; tokenLast4: string }
  | { type: 'basic'; username: string; password: string; passwordLast4: string };

export type DecryptedHttpConnectorInstanceConfig = {
  baseUrl: string;
  auth: DecryptedHttpConnectorAuthConfig;
};
