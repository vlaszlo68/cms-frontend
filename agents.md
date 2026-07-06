# Agent Notes

## Role

This repository is the React frontend for the CMS backend developed in the sibling backend project.

Use the current source tree, `project.md`, and `README.md` as the local source of truth. Older bootstrap or handoff notes are superseded when they conflict with implemented code.

## Project Doc Routing

Read `project.md` before tasks that touch API contracts, auth/session/CSRF/CAPTCHA behavior, registration, routing/navigation, feature boundaries, backend proxy/runtime assumptions, deployment notes, broad refactors, or repository documentation cleanup.

For narrow code changes where the immediate source files fully define the behavior, use the local code context first and consult `project.md` only if the contract or architecture is unclear.

## Collaboration Expectations

For meaningful architecture, API, security/session, deletion/renaming, or broad refactor decisions, surface the assumption, scope, affected files, risks, and decision points before editing.

## Plan Mode Collaboration

When working in Plan mode, build the plan interactively. Identify assumptions, scope boundaries, affected files, risks, verification steps, and decision points before implementation.

Ask for user input on frontend architecture, API contracts, auth/session/CSRF/CAPTCHA behavior, registration flows, routing/navigation changes, preference model changes, deletion/renaming, dependency additions, or broad refactors.

Do not ask for approval on trivial implementation details when the existing code pattern clearly determines the choice. Keep momentum by proposing a concrete default and calling out only the decisions that materially affect behavior, maintainability, or backend compatibility.

## Working Principles

- Keep the frontend architecture explicit, lightweight, and close to the current file structure.
- Preserve the existing React Context based auth and preferences patterns.
- Do not introduce Redux, heavy state libraries, or UI frameworks unless the project explicitly adopts them.
- Use plain `fetch` through the shared API helpers; keep backend envelope parsing in `src/api/httpClient.ts`.
- Use `react-router` imports for React Router v7; do not add new `react-router-dom` imports.
- Keep API response payload types in `src/api/types.ts` or the relevant domain model file.
- Keep CSRF storage in `src/api/authSession.ts` and CSRF header injection in `src/api/httpClient.ts`.
- Surface backend `error.message` values through the shared `ApiError` class.
- Prefer small, verifiable changes over broad restructuring.
- Add integration comments only where they prevent likely backend/frontend contract mistakes.
- Avoid deprecated React event types for new code when an explicit event type is needed; prefer current React types such as `SyntheticEvent` where practical.

## Stack And Commands

- React 19
- TypeScript
- Vite
- React Router v7 from `react-router`
- Browser cookie based session auth
- Plain `fetch`

Useful commands:

```bash
npm install
npm run dev
npm run build
npm run preview
```

There is no configured ESLint, Prettier, Vitest, or React Testing Library setup yet.

## Backend Integration Rules

- Frontend API calls must use relative `/api/...` paths, not full `localhost` URLs.
- Every auth or protected API request must send `credentials: "include"`.
- Backend responses use the shared `{ success, data/error }` envelope.
- Backend error payloads may include `validationErrors`; keep that handling centralized in `ApiError`.
- Login and `/api/auth/me` return session data with a CSRF token.
- Store the latest CSRF token in auth/session state and send it as `X-CSRF-Token` on `POST`, `PUT`, `PATCH`, and `DELETE`.
- Do not send a CSRF header on `GET`, `HEAD`, or `OPTIONS`.
- Public auth POSTs such as login and registration use `apiPublicPost` and skip CSRF.
- Logout and logged-out state must clear the stored CSRF token.
- Treat protected API `401 AUTH_REQUIRED` responses as logged-out state through the shared auth-required handler.
- Do not manipulate, name, clear, or repair backend session cookies from frontend code.
- Vite currently proxies `/api` to `http://localhost:8080` and rewrites requests to `/cms-app/api`.
- Vite uses `cookiePathRewrite: "/"` so backend session cookies work from the frontend dev origin.

## Current Implemented Scope

Implemented areas include:

- API client with cookie credentials, envelope parsing, CSRF injection, and `ApiError`
- Auth API, auth context, startup session restore, login, logout, registration, CAPTCHA, and auth config
- Password policy display and frontend password validation helpers
- Protected app shell with dashboard and authenticated layout
- ADMIN-only User CRUD with approval/rejection actions
- ADMIN-only Page CRUD with `CONTENT` and `BLOCK` page types
- ADMIN-only PageBlock CRUD
- ADMIN-only Media Library with multipart upload and content preview
- ADMIN-only Menu and Menu Item management with `PAGE` and `URL` target UI
- ADMIN-only Template CRUD and Site Settings editor
- Settings page with persisted appearance preferences
- English/Hungarian UI labels

## Source Layout

Current structure:

```text
src/
  api/
    authApi.ts
    authSession.ts
    httpClient.ts
    mediaApi.ts
    menuApi.ts
    pageApi.ts
    pageBlockApi.ts
    siteSettingsApi.ts
    templateApi.ts
    types.ts
    userApi.ts
  auth/
    AuthContext.tsx
    passwordPolicy.ts
    useCaptchaChallenge.ts
  components/
    auth/
      CaptchaField.tsx
      PasswordRequirements.tsx
    layout/
      AppLayout.tsx
      Header.tsx
      Navigation.tsx
    media/
      MediaUploadDialog.tsx
    ui/
      ButtonLabel.tsx
      ConfirmDialog.tsx
      DraggableDialog.tsx
  i18n/
    translations.ts
  models/
  pages/
  preferences/
    PreferencesContext.tsx
  App.tsx
  main.tsx
  styles.css
```

Follow this structure for nearby changes. Do not migrate to a feature-folder architecture unless that is the explicit task.

## Verification

Before finishing code changes, run:

```bash
npm run build
```

For auth, API, or routing changes, also reason through the relevant browser flow:

- unauthenticated startup calls `/api/auth/me` and handles `401 AUTH_REQUIRED`
- login/registration load `/api/auth/config`
- enabled CAPTCHA flows request `/api/auth/captcha?purpose=login|registration`
- successful login stores user and CSRF token
- mutating API calls send `X-CSRF-Token`
- logout clears frontend auth state and CSRF token
- protected routes redirect unauthenticated users to `/login`
- ADMIN-only routes redirect non-admin users to `/`

## Compatibility Notes

- Menu item UI supports both `PAGE` and `URL` targets. Do not remove URL support. Verify backend service behavior before claiming end-to-end URL menu items are complete.
- PageBlock `configJson` remains raw editable text; the frontend must not parse it unless the project explicitly adopts a schema or builder.
- Template, Site Settings, Page template, PageType, and PageBlock contracts may still evolve with backend work. Reconcile contract changes locally without replacing the current frontend architecture or design system.
