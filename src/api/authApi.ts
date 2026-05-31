import { apiGet, apiPost, apiPublicPost } from "./httpClient";
import type { User, UserRole } from "../models/user";

/**
 * Credentials submitted from the login form.
 */
export type LoginRequest = {
  loginName: string;
  password: string;
  captchaId?: string;
  captchaAnswer?: string;
  captchaHoneypot?: string;
};

export type RegisterRequest = {
  loginName: string;
  userName: string;
  emailAddress: string;
  password: string;
  captchaId?: string;
  captchaAnswer?: string;
  captchaHoneypot?: string;
};

export type CaptchaChallenge = {
  captchaId: string;
  svgText: string;
};

export type CaptchaPurpose = "login" | "registration";

export class CaptchaLoadError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CaptchaLoadError";
    this.status = status;
  }
}

export type PasswordPolicyConfig = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
};

export type AuthConfig = {
  loginCaptchaEnabled: boolean;
  registrationCaptchaEnabled: boolean;
  passwordPolicy: PasswordPolicyConfig;
};

/**
 * Authenticated user data returned by the backend.
 */
export type AuthUser = {
  id: number;
  loginName: string;
  email: string;
  role: UserRole;
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
  return apiPublicPost<AuthSession>("/api/auth/login", input);
}

/**
 * Loads public authentication UI flags used by login and registration screens.
 */
export function getAuthConfig() {
  return apiGet<AuthConfig>("/api/auth/config");
}

/**
 * Creates a public registration request. Registration does not establish a session.
 */
export function register(input: RegisterRequest) {
  return apiPublicPost<User>("/api/auth/register", input);
}

/**
 * Loads a fresh SVG CAPTCHA challenge for the requested public auth purpose.
 */
export async function getCaptcha(purpose: CaptchaPurpose): Promise<CaptchaChallenge> {
  const response = await fetch(`/api/auth/captcha?purpose=${encodeURIComponent(purpose)}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new CaptchaLoadError(response.status, "Failed to load captcha.");
  }

  const captchaId = response.headers.get("X-Captcha-Id");
  const svgText = await response.text();

  if (!captchaId) {
    throw new Error("Missing captcha id.");
  }

  return { captchaId, svgText };
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
