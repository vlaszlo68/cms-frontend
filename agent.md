# Agent Notes

## Role

This repository is the React frontend for the CMS backend developed in parallel in the sibling backend project.

When working here, treat the backend contract in `FRONTEND_HANDOFF.md` and the bootstrap direction in `FRONTEND_BOOTSTRAP_PLAN.md` as the current local source of truth until the real frontend codebase and backend API documentation supersede them.

## Working Principles

- Keep the current frontend architecture explicit and lightweight.
- Auth, User CRUD, Page CRUD, and the preferences UI are already implemented; preserve those patterns.
- Prefer small, verifiable changes over broad framework setup.
- Follow the existing project structure once the React app is initialized.
- Do not introduce Redux or heavier state libraries for the initial auth flow; use React context first.
- Use plain `fetch` for HTTP unless the project later adopts a different standard.
- API responses use the shared `{ success, data/error }` backend envelope.
- Use `react-router` imports for React Router v7; do not add new `react-router-dom` imports.
- Avoid deprecated React event types such as `FormEvent`; prefer non-deprecated React event types when an explicit event type is needed.
- Keep response envelope parsing centralized in `src/api/httpClient.ts`.
- Keep CSRF header injection centralized in `src/api/httpClient.ts`.
- Put shared API response payload types in `src/api/types.ts`.
- Backend `error.message` values should be surfaced through the frontend `ApiError` class.
- Keep backend integration details visible in code comments or README only where they prevent mistakes.

## Expected Stack

- React 19
- TypeScript
- Vite
- React Router v7 from the `react-router` package
- Browser cookie based session auth
- Plain `fetch`

Reasonable later additions:

- ESLint
- Prettier
- Vitest
- React Testing Library

## Backend Integration Rules

- The backend uses session based authentication.
- Every auth or protected API request must send `credentials: 'include'`.
- Login and `/api/auth/me` return a flat `data` payload with `id`, `loginName`, `email`, and `csrfToken`.
- Store the latest CSRF token in auth/session state and send it as `X-CSRF-Token` on `POST`, `PUT`, `PATCH`, and `DELETE`.
- Do not send a CSRF header on `GET`, `HEAD`, or `OPTIONS`.
- Logout and logged-out state must clear the stored CSRF token.
- Frontend code should call relative `/api/...` paths, not full `localhost` URLs.
- During local frontend development, the Vite proxy for `/api` remains the simplest mode; the backend also has CORS configured for `http://localhost:5173` and `http://127.0.0.1:5173`.
- Current verified local backend is `http://localhost:8080/cms-app`, so Vite rewrites `/api/...` to `/cms-app/api/...`.
- Vite also uses `cookiePathRewrite: "/"` so backend session cookies work with frontend-origin `/api/...` requests.
- Backend `AuthFilter` public-path matching uses servlet paths and works both at root context and under `/cms-app`.
- Treat any protected API `401` response as logged-out state.

## Current Frontend Scope

Implemented:

- API client with cookie credentials and CSRF injection
- Auth API wrapper and CSRF token helper
- Auth context and startup session restore through `/api/auth/me`
- Login, logout, protected route shell, dashboard, and authenticated layout
- ADMIN-only User CRUD frontend routes and API wrapper
- ADMIN-only Page CRUD frontend routes and API wrapper
- Settings page with persisted appearance preferences
- English/Hungarian labels
- configurable themes, menu layout/behavior, date/time display, date format, density, table striping, table page size, content width, font size, button size, reduced motion, and button icons

Avoid introducing heavy state libraries or UI frameworks unless the project explicitly adopts them.

Current milestone status: auth flow, authenticated app layout, User CRUD frontend, Page CRUD frontend, and settings/preferences UI are implemented. The project is repeatedly verified with `npm run build`.

## Suggested Structure

Current implemented structure is simpler:

```text
src/
  api/
    authSession.ts
    authApi.ts
    httpClient.ts
    pageApi.ts
    types.ts
    userApi.ts
  auth/
    AuthContext.tsx
  components/
    layout/
      AppLayout.tsx
      Header.tsx
      Navigation.tsx
    ui/
      ButtonLabel.tsx
      ConfirmDialog.tsx
  i18n/
    translations.ts
  models/
    page.ts
    user.ts
  pages/
    DashboardPage.tsx
    LoginPage.tsx
    PageFormPage.tsx
    PagesPage.tsx
    RegisterPage.tsx
    SettingsPage.tsx
    UserFormPage.tsx
    UsersPage.tsx
  preferences/
    PreferencesContext.tsx
  App.tsx
  main.tsx
  styles.css
```

Longer-term suggested structure:

```text
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
```

## Verification Checklist

Before calling the first auth milestone done, verify:

- unauthenticated startup calls `/api/auth/me` and reaches logged-out state on `401`
- login posts `loginName` and `password` as JSON
- successful API responses are unwrapped from `data`
- backend `success: false` responses throw the shared frontend `ApiError`
- login errors display the backend `error.message`
- login stores the returned user in memory state
- login stores the returned CSRF token in auth/session state
- refresh after login restores the session through `/api/auth/me`
- mutating API requests send `X-CSRF-Token`
- logout invalidates the backend session and clears frontend auth state plus CSRF token
- protected routes redirect unauthenticated users to `/login`
- authenticated routes render through `AppLayout`
- header shows the current user's `loginName`
- navigation includes Dashboard, Users, Pages, and Settings links
- Users and Pages navigation/routes are available only for ADMIN users
- Users and Pages lists support frontend pagination and three-state column sorting
- destructive list actions use the shared confirmation dialog
- Page editing supports textarea HTML editing with simple insert buttons and sanitized preview modes
- settings changes persist in localStorage and apply immediately
