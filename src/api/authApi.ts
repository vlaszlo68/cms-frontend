import { apiGet, apiPost } from "./httpClient";

/**
 * Credentials submitted from the login form.
 */
export type LoginRequest = {
  loginName: string;
  password: string;
};

/**
 * Authenticated user data returned by the backend.
 */
export type AuthUser = {
  id: number;
  loginName: string;
  email: string;
};

/**
 * Session payload returned after login or session refresh.
 */
export type AuthSession = AuthUser & {
  csrfToken: string;
};

/**
 * Response returned after a logout request.
 */
export type LogoutResponse = {
  message: string;
};

/**
 * Authenticates a user and returns the newly established session.
 */
export function login(input: LoginRequest) {
  return apiPost<AuthSession>("/api/auth/login", input);
}

/**
 * Ends the current backend session.
 */
export function logout() {
  return apiPost<LogoutResponse>("/api/auth/logout");
}

/**
 * Loads the current authenticated session from the backend.
 */
export function me() {
  return apiGet<AuthSession>("/api/auth/me");
}
