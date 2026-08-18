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

const COOKIE_NAME = 'auth_token';
const COOKIE_DAYS = 7;

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

function userFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return { id: payload.sub, name: payload.name, email: payload.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const stored = Cookies.get(COOKIE_NAME);
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }
    const decoded = userFromToken(stored);
    if (!decoded) {
      Cookies.remove(COOKIE_NAME);
      setStatus('unauthenticated');
      return;
    }
    setToken(stored);
    setUser(decoded);
    setStatus('authenticated');
  }, []);

  const login = useCallback((nextToken: string) => {
    const decoded = userFromToken(nextToken);
    if (!decoded) return;
    Cookies.set(COOKIE_NAME, nextToken, {
      expires: COOKIE_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    setToken(nextToken);
    setUser(decoded);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(COOKIE_NAME);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout],
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
