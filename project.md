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
- CSRF session key: `csrfToken`
- CSRF model: login and `/api/auth/me` return `csrfToken`; mutating API requests send it as `X-CSRF-Token`

On successful login, the backend rotates the session id, stores a password-hash-free `AuthenticatedUser` object in the HTTP session, creates a session CSRF token, and returns that token in the auth response.

## Current Frontend State

Implemented:

- Vite React TypeScript scaffold
- React Router v7 imported from `react-router`
- shared API response types in `src/api/types.ts`
- in-memory auth session/CSRF token helper in `src/api/authSession.ts`
- `fetch` based API client in `src/api/httpClient.ts`
- auth API wrapper in `src/api/authApi.ts`
- React auth context in `src/auth/AuthContext.tsx`
- authenticated layout components in `src/components/layout/`
- login page at `/login`
- protected dashboard route at `/`
- ADMIN-only User CRUD routes at `/users`, `/users/new`, and `/users/:userId/edit`
- protected placeholder route at `/pages`
- protected settings route at `/settings`
- logout flow
- Vite dev proxy for the backend
- User CRUD API wrapper and TypeScript models
- local appearance/preferences context
- English/Hungarian UI labels
- theme, menu, date/time, density, table, content-width, reduced-motion, and button-icon settings

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
http://localhost:8081/cms-app
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
VITE_API_BASE_URL=http://localhost:8081/cms-app
```

## Auth API Contract

All backend API responses use the common envelope:

```ts
type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };
```

The frontend `httpClient` unwraps successful `data` values. For `success: false`, it throws the shared frontend `ApiError` class from `src/api/httpClient.ts`, with the backend error `message` exposed as `error.message` and the backend error `code` exposed as `error.code`.

The frontend `httpClient` always uses `credentials: 'include'`. It also reads the current CSRF token from `src/api/authSession.ts` and sends `X-CSRF-Token` for `POST`, `PUT`, `PATCH`, and `DELETE` requests only. `GET`, `HEAD`, and `OPTIONS` requests do not receive a CSRF header.

If a protected API call returns `401 AUTH_REQUIRED`, the shared client notifies `AuthContext`, which clears only the frontend's in-memory user and CSRF state. The frontend does not read, write, delete, or name the session cookie. `403 CSRF_INVALID` remains a backend/API error path; the frontend must not try to repair it by manipulating cookies.

`POST /api/auth/login` is a public exception and does not require an existing CSRF token. Logout is state-changing and must send the current token after login/session restore.

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

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

Invalid request examples:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "loginName and password are required."
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid JSON request body."
  }
}
```

### `POST /api/auth/logout`

No request body is required.

Required header after login/session restore:

```http
X-CSRF-Token: <csrfToken>
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Logged out"
  }
}
```

### `GET /api/auth/me`

Authenticated response:

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

Expected unauthenticated response:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

Invalid or missing CSRF token on state-changing requests:

```json
{
  "success": false,
  "error": {
    "code": "CSRF_INVALID",
    "message": "Invalid CSRF token"
  }
}
```

## Frontend Auth Flow

1. On app startup, call `GET /api/auth/me` with `credentials: 'include'`.
2. If the response is `200` and `success: true`, hydrate auth state from `data` and store `data.csrfToken`.
3. If the response is `401 AUTH_REQUIRED`, treat the visitor as logged out and clear the in-memory user and CSRF token.
4. On login, call `POST /api/auth/login` with JSON body and `credentials: 'include'`.
5. On login success, replace any previous CSRF token with the token from the latest backend response.
6. On logout, call `POST /api/auth/logout` with `credentials: 'include'` and the current CSRF token, then clear local auth state and the CSRF token.
7. If any protected API call returns `401 AUTH_REQUIRED`, the central API/auth bridge clears auth state and the CSRF token, causing protected routes to fall back to login.
8. If a protected state-changing call returns `403 CSRF_INVALID`, show the API error path without cookie manipulation.

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
  role: "ADMIN" | "USER";
};

export type AuthSession = AuthUser & {
  csrfToken: string;
};
```

Suggested auth state:

```ts
type AuthState = {
  user: AuthUser | null;
  csrfToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};
```

## Routing

Current routes:

- `/login`: login page; redirect to `/` if already authenticated
- `/`: protected app shell with dashboard
- `/users`: ADMIN-only user list
- `/users/new`: ADMIN-only user create form
- `/users/:userId/edit`: ADMIN-only user edit form
- `/pages`: protected app shell with pages placeholder
- `/settings`: protected settings page

Authenticated routes render inside `src/components/layout/AppLayout.tsx`, which composes:

- `Header.tsx`: app name, current `loginName`, logout button
- `Navigation.tsx`: Dashboard, Users, Pages, and Settings links
- main content area for route children

The Users navigation entry and user routes are hidden or blocked unless the authenticated user has the `ADMIN` role.

## Local Development Notes

The backend has dedicated CORS support for local dev origins, but the Vite dev proxy remains the simplest local development mode:

- frontend dev server: `http://127.0.0.1:5173`
- frontend calls relative `/api/...` paths
- proxy target: `http://localhost:8081`
- proxy rewrite: `/api/...` -> `/cms-app/api/...`
- proxy cookie path rewrite: backend `Path=/cms-app` cookies are rewritten to `Path=/`
- direct browser calls from `http://localhost:5173` and `http://127.0.0.1:5173` are also supported by backend CORS
- the backend CORS preflight allows the `X-CSRF-Token` header

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

The backend `AuthFilter` compares `request.getServletPath()` against exact public paths:

- `/api/auth/login`
- `/api/auth/logout`

This path matching is context-path safe, so public auth endpoints work both at root context and under `/cms-app`.

During local verification, the backend did work under `/cms-app` on port `8081`:

- `POST http://localhost:8081/cms-app/api/auth/login`
- `GET http://localhost:8081/cms-app/api/auth/me`

The current frontend proxy rewrite targets the local `/cms-app` deployment. Root-context backend deployment can use root `/api/...` paths.

## First Deliverable Status

The first useful frontend milestone now includes:

- Vite React TypeScript scaffold
- API client
- in-memory CSRF token helper
- shared API response types
- central response envelope parsing, CSRF header injection, and backend error message handling
- auth API module
- auth context and session restore
- login page
- protected route wrapper
- authenticated app shell
- dashboard page
- ADMIN-only User CRUD UI and API integration
- placeholder route for Pages
- Settings page with persisted appearance preferences
- logout button
- README with setup, proxy, and backend dependency notes
- JSDoc comments for implemented API, auth, routing, page, and layout files
- verified `npm run build`
- verified proxied login and session restore

## User CRUD Frontend Slice

Implemented files:

- `src/models/user.ts`
- `src/api/userApi.ts`
- `src/pages/UsersPage.tsx`
- `src/pages/UserFormPage.tsx`

API methods:

```ts
getUsers(): Promise<User[]>
getUser(id: number): Promise<User>
createUser(input: CreateUserRequest): Promise<User>
updateUser(id: number, input: UpdateUserRequest): Promise<User>
deleteUser(id: number): Promise<User>
```

The delete action is a soft deactivate flow. The UI calls `DELETE /api/users/{id}` and updates the list with the returned inactive user.

## Preferences And Appearance

Implemented files:

- `src/preferences/PreferencesContext.tsx`
- `src/i18n/translations.ts`
- `src/pages/SettingsPage.tsx`
- `src/components/ui/ButtonLabel.tsx`

Preferences are stored in `localStorage` and applied immediately. Current options include language, theme, navigation layout, menu behavior, header date/time visibility, date format, display density, striped tables, content width, reduced motion, and button icons.

## Local Test User

Backend verification currently uses a development-only user configured locally:

```text
loginName: tester
password: pw
email: tester@example.com
```

This is a local test detail only, not a product requirement.
