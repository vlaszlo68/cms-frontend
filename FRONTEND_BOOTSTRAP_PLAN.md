# Frontend Bootstrap Plan

## Goal

Create a separate React frontend repository for the CMS backend described in `FRONTEND_HANDOFF.md`.

Status: the initial auth-only frontend milestone has now been implemented in this repository.

Recommended location:

```text
D:\java\IdeaProjects\
  cms-app\
  cms-frontend\
```

The frontend should be developed as an independent repository with its own Git history, Node toolchain, build pipeline, and deployment flow.

## Recommended Stack

- React 19
- TypeScript
- Vite
- React Router v7 from the `react-router` package
- plain `fetch` for HTTP
- session-based auth using browser cookies
- CSRF protection using the session token returned by login and `/api/auth/me`

Optional but reasonable later additions:

- ESLint
- Prettier
- Vitest
- React Testing Library

## Repo Structure

Current implemented structure is intentionally smaller than the originally suggested long-term structure:

```text
cms-frontend/
  src/
    api/
      authSession.ts
      authApi.ts
      httpClient.ts
      types.ts
    auth/
      AuthContext.tsx
    components/
      layout/
        AppLayout.tsx
        Header.tsx
        Navigation.tsx
    pages/
      DashboardPage.tsx
      LoginPage.tsx
    App.tsx
    main.tsx
    styles.css
  index.html
  package.json
  README.md
  tsconfig.json
  vite.config.ts
```

Original longer-term suggested structure:

```text
cms-frontend/
  public/
  src/
    api/
      authApi.ts
      httpClient.ts
    app/
      providers.tsx
      router.tsx
    components/
      common/
      layout/
    features/
      auth/
        components/
        hooks/
        pages/
        types.ts
      dashboard/
        components/
        pages/
    hooks/
    lib/
    styles/
      globals.css
      variables.css
    types/
    App.tsx
    main.tsx
  .env.example
  .gitignore
  eslint.config.js
  index.html
  package.json
  README.md
  tsconfig.json
  vite.config.ts
```

## Initial App Scope

The first usable frontend milestone should only solve auth and app shell concerns:

1. Login page
2. Session restore on app startup through `/api/auth/me`
3. Logout action
4. Protected route shell
5. Placeholder dashboard page after login
6. Basic authenticated app layout with header, navigation, and content area

Do not start with full CMS functionality. First make auth integration stable.

## Environment Variables

The current implementation does not require a frontend API base env var during development. It uses relative `/api/...` calls and Vite proxying.

Optional `.env.example` if the project later switches away from proxy-only relative calls:

```env
VITE_API_BASE_URL=http://localhost:8081
```

For standalone Tomcat instead of Docker:

```env
VITE_API_BASE_URL=http://localhost:8081/cms-app
```

## API Layer Design

The backend now returns a common response envelope for all API calls.

Successful response shape:

```ts
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};
```

Error response shape:

```ts
type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};
```

Current implemented shared types live in `src/api/types.ts`:

- `ApiResponse<T>`
- backend error payload type `ApiError`

### `src/api/httpClient.ts`

Responsibilities:

- call relative `/api/...` paths without hard-coded backend hostnames
- set `credentials: 'include'`
- add `X-CSRF-Token` for `POST`, `PUT`, `PATCH`, and `DELETE` when a token is available
- set `Content-Type: application/json` for JSON requests
- parse JSON responses using the common `success/data/error` envelope
- unwrap successful `data` values
- throw the shared frontend `ApiError` class when `success: false`
- preserve backend `error.code` and expose backend `error.message`
- normalize `401` handling

Suggested shape:

- `apiGet<T>(path: string)`
- `apiPost<T>(path: string, body?: unknown)`
- `apiPut<T>(path: string, body?: unknown)`
- `apiPatch<T>(path: string, body?: unknown)`
- `apiDelete<T>(path: string, body?: unknown)`

### `src/api/authSession.ts`

Responsibilities:

- keep the current CSRF token available to the shared API client
- expose `getCsrfToken()` and `setCsrfToken(nextCsrfToken)`
- keep storage in memory for now, matching the current auth context state

### `src/api/authApi.ts`

Expose:

- `login(input)`
- `logout()`
- `me()`

Suggested request/response types:

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

export type AuthSession = AuthUser & {
  csrfToken: string;
};
```

## Auth State Design

Suggested minimal auth state:

```ts
type AuthState = {
  user: AuthUser | null;
  csrfToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};
```

Recommended behavior:

- app start:
  - call `me()`
  - `200` -> set authenticated user and CSRF token
  - `401` -> set logged-out state and clear CSRF token
- login success:
  - store returned user and CSRF token in memory state
- logout success:
  - clear auth state and CSRF token
- protected API `401`:
  - clear auth state and CSRF token
  - redirect to login
- protected API `403` + `CSRF_INVALID`:
  - refresh session through `me()` or force logout, depending on UX choice

Keep auth state in React context first. No need for Redux or heavier state libraries at this stage.

## Routing

Suggested routes:

- `/login`
- `/`
- `/users`
- `/pages`

Behavior:

- `/login`
  - if already authenticated, redirect to `/`
- `/`
  - protected route
  - render dashboard inside authenticated app layout
- `/users`
  - protected route
  - render users placeholder inside authenticated app layout
- `/pages`
  - protected route
  - render pages placeholder inside authenticated app layout

Suggested files:

- current: `src/App.tsx`
- current: `src/pages/LoginPage.tsx`
- current: `src/pages/DashboardPage.tsx`
- current: `src/components/layout/AppLayout.tsx`
- current: `src/components/layout/Header.tsx`
- current: `src/components/layout/Navigation.tsx`

## Local Dev Integration

## Preferred mode

Use either supported backend context during frontend development:

- backend app: `http://localhost:8081`
- standalone Tomcat app: `http://localhost:8081/cms-app`

Reason:

- the backend `AuthFilter` now uses servlet paths, so auth public-path matching works in both root-context and `/cms-app` deployments

Current verified local mode:

- backend app: `http://localhost:8081/cms-app`
- frontend app: `http://localhost:5173` or `http://127.0.0.1:5173`
- Vite proxy target: `http://localhost:8081`
- Vite proxy rewrite: `/api/...` -> `/cms-app/api/...`
- Vite proxy cookie path rewrite: `Path=/`

## Dev proxy recommendation

The backend now has CORS support for `http://localhost:5173` and `http://127.0.0.1:5173`, but a Vite proxy remains the simplest local development mode.

Example direction for `vite.config.ts`:

- frontend dev server: `http://127.0.0.1:5173`
- proxy `/api` to `http://localhost:8081`
- for current `/cms-app` backend context, rewrite `/api` to `/cms-app/api`
- use `cookiePathRewrite: "/"` so session cookies are sent on frontend-origin `/api/...` requests

If you also need non-API backend resources later, proxy them explicitly.

## UI Composition Recommendation

Keep the first UI intentionally small and functional:

- centered login card
- clear error banner for `401`
- loading state during session restore
- simple authenticated shell with top bar and logout button
- placeholder side/top navigation for early CMS sections

Do not overbuild component libraries before the auth flow is proven.

## Suggested File Responsibilities

### `src/features/auth/pages/LoginPage.tsx`

- login form
- submit handler
- field-level local state
- render backend auth errors

### `src/features/auth/hooks/useAuth.ts`

- expose auth context
- helpers like `login`, `logout`, `refreshUser`

### `src/app/providers.tsx`

- auth provider
- router provider wrapper if needed

### `src/components/layout/AppLayout.tsx`

- authenticated layout
- renders `Header`
- renders `Navigation`
- content outlet

### `src/components/layout/Header.tsx`

- app name
- current authenticated user's `loginName`
- logout button wired through `AuthContext.logout()`

### `src/components/layout/Navigation.tsx`

- Dashboard link
- Users placeholder link
- Pages placeholder link

## Bootstrap Sequence

1. Create `cms-frontend` repo in a separate directory. Done.
2. Initialize Vite React TypeScript app. Done.
3. Add router. Done.
4. Create `.env.example`. Deferred because the current app uses proxy-only relative API paths.
5. Implement `httpClient.ts`. Done.
6. Implement shared API response types in `src/api/types.ts`. Done.
7. Implement `authSession.ts` and `authApi.ts`. Done.
8. Implement auth context and startup session restore. Done.
9. Implement login page. Done.
10. Implement protected route wrapper. Done in `src/App.tsx`.
11. Implement logout action. Done.
12. Implement basic authenticated layout. Done.
13. Verify full flow against backend:
    - unauthenticated `me`
    - login success
    - CSRF token is stored after login/me
    - mutating requests send `X-CSRF-Token`
    - refresh after login
    - logout success
    - protected route redirect
14. Add JSDoc documentation to the implemented TypeScript source files. Done.
15. Replace deprecated React form event typing and use direct React Router v7 imports from `react-router`. Done.

## Recommended First Deliverable

The first frontend PR/repo milestone should include:

- project scaffold
- auth API integration
- CSRF token handling for mutating API requests
- common API response types
- central response unwrapping, CSRF header injection, and error handling
- login page
- protected dashboard placeholder
- authenticated app layout
- placeholder navigation routes
- logout button
- Vite proxy config
- README with startup instructions
- JSDoc comments for the implemented source files

## README Checklist For Frontend Repo

The new frontend repo should document:

- required Node version
- install command
- run command
- env variables
- backend dependency
- local proxy behavior
- current implemented routes
- auth/session notes

## Risks To Keep Visible

### 1. Backend CORS is not implemented

Without proxy or backend CORS work, browser requests from a separate dev origin may fail.

### 2. Backend auth uses session cookies

Every request that depends on authentication must send credentials.

### 3. Backend CSRF protection applies to mutating requests

Login and session restore must keep the returned `csrfToken`; `POST`, `PUT`, `PATCH`, and `DELETE` requests must send it in `X-CSRF-Token`.

### 4. Backend filter path logic is context-path safe

The backend uses servlet paths for auth public-path matching, so both root context and `/cms-app` deployments are supported.

## Recommended Next Step

Recommended next steps:

1. Keep the auth-only frontend stable before adding CMS features.
2. Replace `/users` and `/pages` placeholders with real CMS screens when backend endpoints are ready.
3. Keep the current local proxy rewrite aligned with whichever backend context is running.
