import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/httpClient";
import { setCsrfToken as setStoredCsrfToken } from "../api/authSession";
import * as authApi from "../api/authApi";
import type { AuthSession, AuthUser, LoginRequest } from "../api/authApi";

/**
 * Authentication state and actions exposed to the React component tree.
 */
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

/**
 * Provides authentication state, session refresh, login, and logout behavior.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Updates both React state and the API client's in-memory CSRF token.
   */
  const setSession = useCallback((nextUser: AuthUser | null, nextCsrfToken: string | null) => {
    setUser(nextUser);
    setCsrfToken(nextCsrfToken);
    setStoredCsrfToken(nextCsrfToken);
  }, []);

  /**
   * Splits a backend session payload into user state and CSRF token storage.
   */
  const setAuthenticatedSession = useCallback(
    (session: AuthSession) => {
      const { csrfToken: nextCsrfToken, ...nextUser } = session;
      setSession(nextUser, nextCsrfToken);
      return nextUser;
    },
    [setSession],
  );

  /**
   * Revalidates the current browser session against the backend.
   */
  const refreshUser = useCallback(async () => {
    try {
      const session = await authApi.me();
      return setAuthenticatedSession(session);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSession(null, null);
        return null;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthenticatedSession, setSession]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  /**
   * Authenticates with credentials and stores the returned session.
   */
  const login = useCallback(
    async (input: LoginRequest) => {
      const session = await authApi.login(input);
      setAuthenticatedSession(session);
    },
    [setAuthenticatedSession],
  );

  /**
   * Ends the backend session and clears local authentication state.
   */
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

/**
 * Reads the current authentication context.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
