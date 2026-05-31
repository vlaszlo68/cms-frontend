let csrfToken: string | null = null;
let authRequiredHandler: (() => void) | null = null;

/**
 * Returns the CSRF token from the current in-memory authentication session.
 */
export function getCsrfToken() {
  return csrfToken;
}

/**
 * Stores the CSRF token for later mutating API requests.
 */
export function setCsrfToken(nextCsrfToken: string | null) {
  csrfToken = nextCsrfToken;
}

/**
 * Registers a callback that clears frontend auth state when the backend reports
 * that the current browser session is no longer authenticated.
 */
export function setAuthRequiredHandler(nextAuthRequiredHandler: (() => void) | null) {
  authRequiredHandler = nextAuthRequiredHandler;
}

/**
 * Notifies the auth state owner about a backend AUTH_REQUIRED response.
 */
export function notifyAuthRequired() {
  authRequiredHandler?.();
}
