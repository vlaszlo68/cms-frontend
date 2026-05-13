import { apiGet, apiPost } from "./httpClient";

export type LoginRequest = {
  loginName: string;
  password: string;
};

export type AuthUser = {
  id: number;
  loginName: string;
  email: string;
};

export type LogoutResponse = {
  message: string;
};

export function login(input: LoginRequest) {
  return apiPost<AuthUser>("/api/auth/login", input);
}

export function logout() {
  return apiPost<LogoutResponse>("/api/auth/logout");
}

export function me() {
  return apiGet<AuthUser>("/api/auth/me");
}
