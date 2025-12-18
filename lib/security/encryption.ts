import crypto from 'crypto';

export type EncryptedPayload = {
  v: 1;
  iv: string;
  tag: string;
  data: string;
};

function getEncryptionKey(): Buffer {
  const secret =
    process.env.CONNECTOR_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      'Missing CONNECTOR_ENCRYPTION_SECRET (or NEXTAUTH_SECRET) for encryption'
    );
  }

  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptString(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
}

export function decryptString(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    typeof v.iv === 'string' &&
    typeof v.tag === 'string' &&
    typeof v.data === 'string'
  );
}
