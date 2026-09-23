'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from './auth-api.client';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  setAuth: (params: { token: string; user: AuthUser }) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_COOKIE = 'auth_token';
const USER_COOKIE = 'auth_user';
const COOKIE_OPTIONS = 'path=/; SameSite=Lax; max-age=1296000';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, options: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; ${options}`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function readAuthFromCookies(): AuthState {
  const token = getCookie(TOKEN_COOKIE);
  if (!token) return { token: null, user: null };
  const userRaw = getCookie(USER_COOKIE);
  if (!userRaw) return { token: null, user: null };
  try {
    return { token, user: JSON.parse(userRaw) as AuthUser };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readAuthFromCookies);

  const setAuth = useCallback(({ token, user }: { token: string; user: AuthUser }) => {
    setCookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    setCookie(USER_COOKIE, JSON.stringify(user), COOKIE_OPTIONS);
    setState({ token, user });
  }, []);

  const clearAuth = useCallback(() => {
    removeCookie(TOKEN_COOKIE);
    removeCookie(USER_COOKIE);
    setState({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
