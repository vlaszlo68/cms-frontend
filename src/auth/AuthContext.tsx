import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/httpClient";
import { setCsrfToken as setStoredCsrfToken } from "../api/authSession";
import * as authApi from "../api/authApi";
import type { AuthUser, LoginRequest } from "../api/authApi";

type AuthContextValue = {
  user: AuthUser | null;
  csrfToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((nextUser: AuthUser | null, nextCsrfToken: string | null) => {
    setUser(nextUser);
    setCsrfToken(nextCsrfToken);
    setStoredCsrfToken(nextCsrfToken);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const session = await authApi.me();
      setSession(session.user, session.csrfToken);
      return session.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSession(null, null);
        return null;
      }

      setSession(null, null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setSession]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (input: LoginRequest) => {
      const session = await authApi.login(input);
      setSession(session.user, session.csrfToken);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSession(null, null);
      setIsLoading(false);
    }
  }, [setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      csrfToken,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [csrfToken, isLoading, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
