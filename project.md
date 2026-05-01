# Project Notes

## Purpose

This repository will contain an independent React frontend for the CMS backend. The backend is developed separately and exposes servlet based JSON endpoints under `/api`.

The frontend should have its own Git history, Node toolchain, build pipeline, and deployment flow.

## Backend Summary

- Stack: Java 21, Servlet API, JDBC, PostgreSQL, Tomcat 9
- Packaging: Maven WAR
- JSON library: Gson
- Auth model: HTTP session based authentication
- Backend session key for authenticated user: `user`

On successful login, the backend stores the full `hu.laci.cms.model.User` object in the HTTP session.

## Runtime URLs

Docker/root-context deployment:

```text
http://localhost:8081
```

Standalone Tomcat deployment with `cms-app.war`:

```text
http://localhost:8080/cms-app
```

Recommended frontend env variable:

```env
VITE_API_BASE_URL=http://localhost:8081
```

Standalone Tomcat alternative:

```env
VITE_API_BASE_URL=http://localhost:8080/cms-app
```

## Auth API Contract

### `POST /api/auth/login`

Request:

```json
{
  "loginName": "string",
  "password": "string"
}
```

Success response:

```json
{
  "id": 1,
  "loginName": "demo-user",
  "email": "user@example.test"
}
```

Invalid credentials:

```json
{
  "error": "Invalid credentials"
}
```

Invalid request examples:

```json
{
  "error": "loginName and password are required."
}
```

```json
{
  "error": "Invalid JSON request body."
}
```

### `POST /api/auth/logout`

No request body is required.

Success response:

```json
{
  "message": "Logged out"
}
```

### `GET /api/auth/me`

Authenticated response:

```json
{
  "id": 1,
  "loginName": "demo-user",
  "email": "user@example.test"
}
```

Expected unauthenticated response:

```json
{
  "error": "Unauthorized"
}
```

## Frontend Auth Flow

1. On app startup, call `GET /api/auth/me` with `credentials: 'include'`.
2. If the response is `200`, hydrate auth state from the returned user.
3. If the response is `401`, treat the visitor as logged out.
4. On login, call `POST /api/auth/login` with JSON body and `credentials: 'include'`.
5. On logout, call `POST /api/auth/logout` with `credentials: 'include'`, then clear local auth state.
6. If any protected API call returns `401`, clear auth state and redirect to login.

Suggested frontend auth types:

```ts
export type LoginRequest = {
  loginName: string;
  password: string;
};

export type AuthUser = {
  id: number;
  loginName: string;
  email: string;
};
```

Suggested auth state:

```ts
type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};
```

## Routing

Initial routes:

- `/login`: login page; redirect to `/` if already authenticated
- `/`: protected app shell with placeholder dashboard

## Local Development Notes

The backend currently has no dedicated CORS support. Use a Vite dev proxy for local development:

- frontend dev server: `http://localhost:5173`
- proxy `/api` to `http://localhost:8081`

The backend `AuthFilter` currently compares `request.getRequestURI()` against exact public paths:

- `/api/auth/login`
- `/api/auth/logout`

This is safest when the backend is deployed at root context, such as Docker `ROOT.war`. Under `/cms-app`, those paths may become `/cms-app/api/auth/login` and `/cms-app/api/auth/logout`, which can affect auth behavior until the backend filter logic is normalized.

## First Deliverable

The first useful frontend milestone should include:

- Vite React TypeScript scaffold
- `.env.example`
- API client
- auth API module
- auth context and session restore
- login page
- protected route wrapper
- authenticated app shell
- dashboard placeholder
- logout button
- README with setup, env, proxy, and backend dependency notes

## Local Test User

Backend verification uses a development-only user configured locally.

This is a local test detail only, not a product requirement.
