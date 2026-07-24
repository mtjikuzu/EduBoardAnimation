import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  getSession,
  setSession,
  clearSession,
  type CreatorSession,
} from "../lib/auth";

interface AuthContextValue {
  creator: CreatorSession | null;
  isLoading: boolean;
  signIn: (email: string, name?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [creator, setCreator] = useState<CreatorSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const session = getSession();
    setCreator(session);
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, name?: string) => {
    setIsLoading(true);
    try {
      const { signupCreator } = await import("../lib/api");
      const profile = await signupCreator(email, name);
      const session: CreatorSession = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      };
      setSession(session);
      setCreator(session);
      setLocation("/");
    } catch (err) {
      console.error("Sign in failed", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setLocation]);

  const signOut = useCallback(() => {
    clearSession();
    setCreator(null);
    setLocation("/signin");
  }, [setLocation]);

  return (
    <AuthContext.Provider value={{ creator, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
