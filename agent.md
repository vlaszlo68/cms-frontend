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
- The API base URL should come from `VITE_API_BASE_URL`.
- During local frontend development, prefer a Vite proxy for `/api` because the backend currently has no dedicated CORS layer.
- Prefer the Docker/root-context backend at `http://localhost:8081` while the backend `AuthFilter` path matching remains context-path sensitive.
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
9. README with setup and backend integration notes.

Avoid implementing broader CMS features before the auth flow is stable.

## Suggested Structure

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
- login stores the returned user in memory state
- refresh after login restores the session through `/api/auth/me`
- logout invalidates the backend session and clears frontend auth state
- protected routes redirect unauthenticated users to `/login`

