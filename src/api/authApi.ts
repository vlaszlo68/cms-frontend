import { apiGet, apiPost } from "./httpClient";

export type LoginRequest = {
  loginName: string;
  password: string;
};

export type AuthUser = {
  id: number;
  loginName: string;
  emailAddress: string;
};

export type AuthSession = {
  user: AuthUser;
  csrfToken: string;
};

export type LogoutResponse = {
  message: string;
};

export function login(input: LoginRequest) {
  return apiPost<AuthSession>("/api/auth/login", input);
}

export function logout() {
  return apiPost<LogoutResponse>("/api/auth/logout");
}

export function me() {
  return apiGet<AuthSession>("/api/auth/me");
}
