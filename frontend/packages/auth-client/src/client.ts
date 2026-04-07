import { createContext, useContext } from 'react';
import type { UserSession } from './types';

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export function useSession(): { session: UserSession | null; isAuthenticated: boolean } {
  const ctx = useContext(AuthContext);
  return { session: ctx.session, isAuthenticated: ctx.isAuthenticated };
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function signIn(): void {
  window.location.href = '/auth/signin';
}

export function signOut(): void {
  window.location.href = '/auth/signout';
}
