# Frontend Handoff

## Purpose

This file summarizes the current backend API contract and runtime assumptions that are relevant for a separate React frontend repository.

Source of truth for this handoff:

- current backend source code under `src/main/java/hu/laci/cms/backend/`
- current Docker/Tomcat setup in `docker-compose.yml` and `docker/tomcat/Dockerfile`

## Backend Summary

- Stack: Java 21, Servlet API, JDBC, PostgreSQL, Tomcat 9
- Packaging: Maven WAR
- Auth model: session-based authentication
- CSRF model: login and `/api/auth/me` return `csrfToken`; mutating API requests send `X-CSRF-Token`
- JSON library: Gson
- Session key for authenticated user: `user`
- CSRF session key: `csrfToken`
- CSRF request header: `X-CSRF-Token`

The backend stores a password-hash-free `hu.laci.cms.backend.dto.auth.AuthenticatedUser` object in the HTTP session on successful login. The backend also stores a CSRF token in the same session and returns it in successful login and `/api/auth/me` responses.

## API Base URL

The effective base URL depends on deployment mode.

### Current verified local setup

The backend is currently reachable on port `8081` under the `/cms-app` context:

- base app URL: `http://localhost:8081/cms-app`
- auth login URL: `http://localhost:8081/cms-app/api/auth/login`
- auth me URL: `http://localhost:8081/cms-app/api/auth/me`

The frontend dev server runs at:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

The React app uses relative API paths only. The Vite dev proxy rewrites:

```text
/api/auth/login -> http://localhost:8081/cms-app/api/auth/login
/api/auth/me    -> http://localhost:8081/cms-app/api/auth/me
```

The current `vite.config.ts` also uses `cookiePathRewrite: "/"` so the browser sends the session cookie back on frontend-origin `/api/...` requests.

### Local Tomcat manual deploy

If the WAR is deployed as `cms-app.war` into a standalone Tomcat:

- base app URL: `http://localhost:8081/cms-app`
- auth login URL: `http://localhost:8081/cms-app/api/auth/login`

### Docker Tomcat deploy

The Docker image copies the WAR as `ROOT.war`, so the app runs on the root context:

- base app URL: `http://localhost:8081`
- auth login URL: `http://localhost:8081/api/auth/login`

If the frontend later stops using a Vite proxy, it may need a full backend base URL, for example:

```env
VITE_API_BASE_URL=http://localhost:8081
```

or for local standalone Tomcat:

```env
VITE_API_BASE_URL=http://localhost:8081/cms-app
```

## Auth Endpoints

All API endpoints now use a common response envelope.

Successful response shape:

```json
{
  "success": true,
  "data": {}
}
```

Error response shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Frontend implication:

- `src/api/httpClient.ts` unwraps `data` for successful responses
- `src/api/httpClient.ts` throws its shared `ApiError` class for `success: false`
- `src/api/httpClient.ts` adds `X-CSRF-Token` to `POST`, `PUT`, `PATCH`, and `DELETE` when a token is available
- backend `error.message` is shown to the user on login failures
- `src/api/types.ts` contains the shared `ApiResponse` and backend error payload types

### `POST /api/auth/login`

Request body:

```json
{
  "loginName": "string",
  "password": "string"
}
```

Successful response:

- status: `200`
- content-type: `application/json`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "loginName": "demo-user",
    "email": "user@example.test",
    "csrfToken": "base64url-token"
  }
}
```

Invalid credentials:

- status: `401`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

Invalid or incomplete JSON:

- status: `400`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "loginName and password are required."
  }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid JSON request body."
  }
}
```

Behavior:

- on success the backend rotates the session id, stores the authenticated user under session attribute `user`, creates a session CSRF token, and returns it in `data.csrfToken`

### `POST /api/auth/logout`

Request body:

- none required

Required header after login/session restore:

```http
X-CSRF-Token: <csrfToken>
```

Successful response:

- status: `200`

```json
{
  "success": true,
  "data": {
    "message": "Logged out"
  }
}
```

Behavior:

- invalidates the current session if one exists
- because logout is state-changing, it is protected by the CSRF filter

### `GET /api/auth/me`

Successful response:

- status: `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "loginName": "demo-user",
    "email": "user@example.test",
    "csrfToken": "base64url-token"
  }
}
```

Unauthenticated response expected by frontend:

- status: `401`

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

Important:

- `/api/auth/me` is behind `AuthFilter`, so unauthenticated requests usually receive the filter-level response:
  - `401`
  - `{"success":false,"error":{"code":"AUTH_REQUIRED","message":"Authentication required"}}`

## Protected API Behavior

There is an `AuthFilter` mapped to:

- `/api/*`

Public exceptions in code:

- `/api/auth/login`
- `/api/auth/logout`

All other `/api/*` endpoints currently require a valid session where the `user` attribute is an `AuthenticatedUser` object.

If there is no authenticated session, the filter returns:

- status: `401`
- content-type: `application/json`

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

Frontend implication:

- any protected API call returning `401` should be treated as logged-out state

## CSRF Protection

State-changing `/api/*` requests are protected by `CsrfFilter`.

Protected HTTP methods:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

Not checked:

- `GET`
- `HEAD`
- `OPTIONS`
- `POST /api/auth/login`

Invalid or missing token response:

- status: `403`

```json
{
  "success": false,
  "error": {
    "code": "CSRF_INVALID",
    "message": "Invalid CSRF token"
  }
}
```

## Cookies and Frontend Fetching

Because authentication is session-based, the frontend must send cookies on every authenticated request.

Recommended fetch usage:

```ts
fetch('/api/auth/me', {
  method: 'GET',
  credentials: 'include',
})
```

The same applies to:

- login
- logout
- every protected `/api/*` request

CSRF handling:

- login and `/api/auth/me` success responses return `data.csrfToken`
- the frontend stores the token in auth/session state
- `POST`, `PUT`, `PATCH`, and `DELETE` requests send `X-CSRF-Token: <csrfToken>`
- `GET`, `HEAD`, and `OPTIONS` requests do not need the CSRF header
- logout clears the stored token after the request completes
- a new login replaces any previous token with the latest backend response value

## Current Known Constraints

### 1. CORS layer is implemented

The backend has a dedicated CORS filter.

Current allowed origins in `web.xml`:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Credentialed CORS is enabled, so `credentials: 'include'` remains required for session auth. The backend also allows the `X-CSRF-Token` request header for CORS preflight.

Practical recommendation for frontend local development:

- the existing Vite dev proxy is still a good option
- direct browser calls from the listed origins are also supported

Example direction:

- React dev server on `127.0.0.1:5173`
- proxy `/api` to `http://localhost:8081`
- in the current local setup, rewrite `/api` to `/cms-app/api`
- rewrite cookie path to `/` when the backend sets a context-path cookie

### 2. AuthFilter public-path matching is context-path safe

Current filter code compares:

- `request.getServletPath()`

against exact strings:

- `/api/auth/login`
- `/api/auth/logout`

Implication:

- public auth endpoints work both at root context and when the app is deployed under `/cms-app`

## Recommended Frontend Auth Flow

1. On app startup call `GET /api/auth/me` with `credentials: 'include'`.
2. If response is `200` and `success: true`, hydrate frontend auth state from `data` and store `data.csrfToken`.
3. If response is `401` or `success: false`, treat the user as logged out when appropriate.
4. On login submit `POST /api/auth/login` with JSON body and `credentials: 'include'`.
5. On login success, replace any previous CSRF token with the returned token.
6. On logout call `POST /api/auth/logout` with `credentials: 'include'` and `X-CSRF-Token`, then clear frontend auth state and the CSRF token.
7. Add `X-CSRF-Token` to all future state-changing API calls.

## Current Verified Frontend Implementation

Files implemented:

- `src/api/httpClient.ts`
- `src/api/authSession.ts`
- `src/api/types.ts`
- `src/api/authApi.ts`
- `src/auth/AuthContext.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Navigation.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/App.tsx`
- `vite.config.ts`

Current routes:

- `/login` - public-only login page
- `/` - protected dashboard rendered inside `AppLayout`
- `/users` - protected placeholder rendered inside `AppLayout`
- `/pages` - protected placeholder rendered inside `AppLayout`

The authenticated layout currently provides:

- app header with app name
- current authenticated user's `loginName`
- logout button that calls `AuthContext.logout()` and navigates to `/login`
- simple navigation links for Dashboard, Users, and Pages

Verified through the Vite proxy:

```text
POST http://127.0.0.1:5173/api/auth/login
GET  http://127.0.0.1:5173/api/auth/me
```

with:

```json
{
  "loginName": "tester",
  "password": "pw"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "loginName": "tester",
    "email": "tester@example.com",
    "csrfToken": "base64url-token"
  }
}
```

## Optional Frontend Env Variables

```env
VITE_API_BASE_URL=http://localhost:8081
```

If using standalone Tomcat instead:

```env
VITE_API_BASE_URL=http://localhost:8081/cms-app
```

## Local Test User

The backend was locally verified with a development-only user:

```text
loginName: tester
password: pw
email: tester@example.com
```

Use locally configured test credentials when verifying the auth flow.

This is only a local development/test detail, not a product requirement.
