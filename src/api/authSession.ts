let csrfToken: string | null = null;

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
