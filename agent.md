# Agent Notes

## Role

This repository is the React frontend for the CMS backend developed in parallel in the sibling backend project.

When working here, treat the backend contract in `FRONTEND_HANDOFF.md` and the bootstrap direction in `FRONTEND_BOOTSTRAP_PLAN.md` as the current local source of truth until the real frontend codebase and backend API documentation supersede them.

## Working Principles

- Keep the first frontend milestone focused on authentication and the authenticated app shell.
- Prefer small, verifiable changes over broad framework setup.
- Follow the existing project structure once the React app is initialized.
- Do not introduce Redux or heavier state libraries for the initial auth flow; use React context first.
- Use plain `fetch` for HTTP unless the project later adopts a different standard.
- API responses use the shared `{ success, data/error }` backend envelope.
- Keep response envelope parsing centralized in `src/api/httpClient.ts`.
- Put shared API response payload types in `src/api/types.ts`.
- Backend `error.message` values should be surfaced through the frontend `ApiError` class.
- Keep backend integration details visible in code comments or README only where they prevent mistakes.

## Expected Stack

- React 19
- TypeScript
- Vite
- React Router
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
- Frontend code should call relative `/api/...` paths, not full `localhost` URLs.
- During local frontend development, use a Vite proxy for `/api` because the backend currently has no dedicated CORS layer.
- Current verified local backend is `http://localhost:8081/cms-app`, so Vite rewrites `/api/...` to `/cms-app/api/...`.
- Vite also uses `cookiePathRewrite: "/"` so backend session cookies work with frontend-origin `/api/...` requests.
- Root-context backend at `http://localhost:8081` remains preferable long term while backend `AuthFilter` path matching remains context-path sensitive.
- Treat any protected API `401` response as logged-out state.

## Initial Frontend Scope

Build the frontend in this order:

1. Project scaffold.
2. API client with cookie credentials.
3. Auth API wrapper.
4. Auth context and startup session restore through `/api/auth/me`.
5. Login page.
6. Protected route shell.
7. Placeholder dashboard.
8. Logout action.
9. Basic authenticated layout with header, navigation, and content area.
10. README with setup and backend integration notes.

Avoid implementing broader CMS features before the auth flow is stable.

Current first milestone status: auth flow and authenticated app layout are implemented and verified through the Vite proxy with `tester` / `pw`.

## Suggested Structure

Current implemented structure is simpler:

```text
src/
  api/
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
- refresh after login restores the session through `/api/auth/me`
- logout invalidates the backend session and clears frontend auth state
- protected routes redirect unauthenticated users to `/login`
- authenticated routes render through `AppLayout`
- header shows the current user's `loginName`
- navigation includes Dashboard, Users, and Pages links
