import { createContext } from 'react';
import type { AuthState, AuthResult } from '../types/auth.types';

export interface AuthContextValue extends AuthState {
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signInWithFacebook: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
