export interface JwtUserPayload {
  sub: string;
  name: string;
  email: string;
}

export function decodeJwtPayload(token: string): JwtUserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder('utf-8').decode(bytes);
    const payload = JSON.parse(json) as Partial<JwtUserPayload>;

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    return { sub: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}
