export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  exp?: number;
}

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary =
    typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const bytes = base64UrlToBytes(parts[1]);
    const json = new TextDecoder('utf-8').decode(bytes);
    const payload = JSON.parse(json) as JwtPayload;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
