import * as jwt from 'jsonwebtoken';

export interface JwtUserPayload {
  id: string;
  name: string;
  email: string;
}

export function signUserToken(
  user: JwtUserPayload,
  secret: string,
  expiresIn: string = '14d',
): string {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    secret,
    { expiresIn } as jwt.SignOptions,
  );
}
