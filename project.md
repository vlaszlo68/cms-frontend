# Project Notes

## Purpose

This repository contains an independent React frontend for the CMS backend. The backend is developed separately and exposes servlet based JSON endpoints under `/api`.

The frontend should have its own Git history, Node toolchain, build pipeline, and deployment flow.

## Backend Summary

- Stack: Java 21, Servlet API, JDBC, PostgreSQL, Tomcat 9
- Packaging: Maven WAR
- JSON library: Gson
- Auth model: HTTP session based authentication
- Backend session key for authenticated user: `user`

On successful login, the backend stores the full `hu.laci.cms.model.User` object in the HTTP session.

## Current Frontend State

Implemented:

- Vite React TypeScript scaffold
- `fetch` based API client in `src/api/httpClient.ts`
- auth API wrapper in `src/api/authApi.ts`
- React auth context in `src/auth/AuthContext.tsx`
- authenticated layout components in `src/components/layout/`
- login page at `/login`
- protected dashboard route at `/`
- protected placeholder routes at `/users` and `/pages`
- logout flow
- Vite dev proxy for the backend

The frontend intentionally uses relative API paths only, for example:

```text
/api/auth/login
/api/auth/logout
/api/auth/me
```

Do not put full `localhost` backend URLs in frontend `fetch` calls.

## Runtime URLs

Docker/root-context deployment:

```text
http://localhost:8081
```

Standalone Tomcat deployment with `cms-app.war`:

```text
http://localhost:8080/cms-app
```

Current verified backend URL:

```text
http://localhost:8081/cms-app
```

Current frontend dev URL:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Historical/alternative frontend env variable if the project later switches away from proxy-only relative calls:

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
- `/`: protected app shell with dashboard
- `/users`: protected app shell with users placeholder
- `/pages`: protected app shell with pages placeholder

Authenticated routes render inside `src/components/layout/AppLayout.tsx`, which composes:

- `Header.tsx`: app name, current `loginName`, logout button
- `Navigation.tsx`: Dashboard, Users, and Pages links
- main content area for route children

## Local Development Notes

The backend currently has no dedicated CORS support. Use a Vite dev proxy for local development:

- frontend dev server: `http://127.0.0.1:5173`
- frontend calls relative `/api/...` paths
- proxy target: `http://localhost:8081`
- proxy rewrite: `/api/...` -> `/cms-app/api/...`
- proxy cookie path rewrite: backend `Path=/cms-app` cookies are rewritten to `Path=/`

Current `vite.config.ts` proxy behavior:

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8081",
      changeOrigin: true,
      cookiePathRewrite: "/",
      rewrite: (path) => path.replace(/^\/api/, "/cms-app/api"),
    },
  },
}
```

The backend `AuthFilter` may compare `request.getRequestURI()` against exact public paths:

- `/api/auth/login`
- `/api/auth/logout`

During local verification, the backend did work under `/cms-app` on port `8081`:

- `POST http://localhost:8081/cms-app/api/auth/login`
- `GET http://localhost:8081/cms-app/api/auth/me`

The frontend proxy rewrite is currently required because `http://localhost:8081/api/auth/me` returns Tomcat HTML `404`, while `http://localhost:8081/cms-app/api/auth/me` returns JSON.

## First Deliverable Status

The first useful frontend milestone now includes:

- Vite React TypeScript scaffold
- API client
- auth API module
- auth context and session restore
- login page
- protected route wrapper
- authenticated app shell
- dashboard page
- placeholder navigation routes for Users and Pages
- logout button
- README with setup, proxy, and backend dependency notes
- verified `npm run build`
- verified proxied login and session restore

## Local Test User

Backend verification currently uses a development-only user configured locally:

```text
loginName: tester
password: pw
email: tester@example.com
```

This is a local test detail only, not a product requirement.
