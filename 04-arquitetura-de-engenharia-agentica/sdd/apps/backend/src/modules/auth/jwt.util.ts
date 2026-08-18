import jwt from 'jsonwebtoken';

export interface UserTokenPayload {
  sub: string;
  name: string;
  email: string;
}

export function signUserToken(
  user: { id: string; name: string; email: string },
  secret: string,
): string {
  const payload: UserTokenPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
  };
  return jwt.sign(payload, secret, { expiresIn: '14d' });
}
