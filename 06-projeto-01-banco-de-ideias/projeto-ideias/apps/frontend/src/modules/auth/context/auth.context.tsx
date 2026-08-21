'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { decodeJwtPayload } from '../util/jwt.util';

export const AUTH_COOKIE_NAME = 'auth_token';
const COOKIE_EXPIRES_DAYS = 7;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hydrate(token: string | null): {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
} {
  if (!token) {
    return { user: null, token: null, status: 'unauthenticated' };
  }
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { user: null, token: null, status: 'unauthenticated' };
  }
  return {
    user: { id: payload.sub, name: payload.name, email: payload.email },
    token,
    status: 'authenticated',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: AuthUser | null;
    token: string | null;
    status: AuthStatus;
  }>({ user: null, token: null, status: 'loading' });

  useEffect(() => {
    const cookieToken = Cookies.get(AUTH_COOKIE_NAME) ?? null;
    const next = hydrate(cookieToken);
    if (!next.token && cookieToken) {
      Cookies.remove(AUTH_COOKIE_NAME);
    }
    setState(next);
  }, []);

  const login = useCallback((token: string) => {
    Cookies.set(AUTH_COOKIE_NAME, token, {
      expires: COOKIE_EXPIRES_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    setState(hydrate(token));
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(AUTH_COOKIE_NAME);
    setState({ user: null, token: null, status: 'unauthenticated' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
