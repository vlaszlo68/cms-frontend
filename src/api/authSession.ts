let csrfToken: string | null = null;

export function getCsrfToken() {
  return csrfToken;
}

export function setCsrfToken(nextCsrfToken: string | null) {
  csrfToken = nextCsrfToken;
}
