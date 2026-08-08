# CMS E2E Coverage

This document is the current coverage map for the Playwright E2E suite in `e2e/`.

Use it when adding, reviewing, or running browser tests. Keep this file aligned with `e2e/`, `project.md`, and `.agents/skills/playwright/SKILL.md` when coverage changes.

## Commands

Run the authenticated suite from PowerShell with the configured local test account:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e
```

Run the same suite with traces for every test:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e:trace
```

The backend must be running. Tests that touch `/api` use the Vite proxy and relative `/api/...` paths.

## Current Coverage

| Area | Spec | Current coverage | Mutates data |
|---|---|---|---|
| CAPTCHA-disabled auth UI | `e2e/auth-captcha-disabled.spec.ts` | Verifies `/api/auth/config` reports login and registration CAPTCHA disabled, login/register forms omit CAPTCHA controls, and no `/api/auth/captcha` request is made. | No |
| Auth/session/registration validation | `e2e/auth-session-registration.spec.ts` | Verifies protected-route redirect to login, invalid login error display, registration password confirmation validation, session restore after reload, logout, and protected redirect after logout. | No |
| Authenticated navigation | `e2e/authenticated-smoke.spec.ts` | Logs in, verifies the dashboard and current user, opens every visible main navigation link, and checks for loading leftovers, visible error messages, console errors, and unexpected HTTP errors. | No |
| Users | `e2e/admin-user-crud.spec.ts` | Creates a unique user, verifies the row, opens edit, updates name/email, verifies changes, deactivates the user, and verifies inactive state. | Yes, test-created user only |
| Registration approval and role authorization | `e2e/admin-user-approval-authorization.spec.ts` | Registers two unique users, approves one, rejects one, logs in as the approved non-admin user, verifies ADMIN navigation/routes are unavailable, and deactivates the approved user. | Yes, test-created users only |
| Pages | `e2e/admin-page-crud.spec.ts` | Creates a unique `CONTENT` page, verifies list fields, opens edit, updates title/status/content, verifies changes, deletes it, and verifies removal. | Yes, test-created page only |
| Page blocks | `e2e/admin-page-block-crud.spec.ts` | Creates a unique `BLOCK` page, creates a PageBlock with raw `configJson`, edits title/type/order/visibility/config, deletes the block, and cleans up the page. | Yes, test-created page and block only |
| Menus | `e2e/admin-menu-crud.spec.ts` | Creates a unique menu, verifies list fields, opens edit, updates name/code/active state, verifies changes, deletes it, and verifies removal. | Yes, test-created menu only |
| Menu items | `e2e/admin-menu-item-crud.spec.ts` | Creates a unique page and menu, verifies browser validation for empty URL targets, creates parent/child PAGE-target items, edits order/visibility, deletes both items, and cleans up the menu/page. | Yes, test-created menu, page, and items only |
| Media | `e2e/admin-media-template-settings.spec.ts` | Uploads a text file, verifies list/details/fallback preview/open-content link, deletes the media item, and cleans up by API if needed. | Yes, test-created media only |
| Templates | `e2e/admin-media-template-settings.spec.ts` | Uploads a preview image, creates a template using it, verifies edit loading, updates code/name/description/active state, deletes the template, and cleans up media. | Yes, test-created template and media only |
| Site settings | `e2e/admin-media-template-settings.spec.ts` | Snapshots singleton settings, saves changed identity/contact/social fields, verifies success, and restores the original singleton values. | Yes, singleton update restored in-test |
| Preferences and i18n | `e2e/preferences-i18n-table.spec.ts` | Persists the design and colour-palette preferences, reloads to verify storage-backed state, switches to Hungarian and back to English, and restores baseline preferences. | No backend mutation |
| Table behavior | `e2e/preferences-i18n-table.spec.ts` | Verifies user-list sortable header `aria-sort` transitions for login name. | No |
| Error handling | `e2e/api-error-handling.spec.ts` | Verifies visible backend envelope error messages and fallback messages when an API request fails at the network layer. | No |

## Known Coverage Gaps

| Area | Missing E2E coverage |
|---|---|
| CAPTCHA-enabled auth | The current local backend is running with CAPTCHA disabled. Enabled-CAPTCHA login/registration challenge loading, answer submission, refresh, and failure handling still need a separate runtime mode. |
| Password policy variants | The current backend config does not expose visible password-policy requirements, so requirement rendering is only indirectly covered by registration validation structure. |
| CSRF invalid responses | The suite verifies logout/session behavior and mutating flows with valid CSRF, but does not intentionally submit stale/invalid CSRF and assert the `CSRF_INVALID` UI path. |
| Menu URL target persistence | The suite verifies URL target browser validation. End-to-end saving of URL menu items remains limited by the documented backend compatibility note. |
| Media preview variants | Text fallback preview is covered and image media is used for template preview selection. Dedicated PDF preview and inline image preview assertions are not exhaustive. |
| Site settings validation failures | Successful save/restore is covered; backend validation failure paths for invalid singleton values are not exhaustive. |
| Internationalization breadth | Hungarian switching and heading rendering are covered, but every auth/list/form flow is not repeated in Hungarian. |
| Table breadth | User-list sort state is covered. Pagination, empty states, and every sortable table are not exhaustively tested. |
| Browser/device matrix | The suite currently runs Chromium desktop only. Mobile/responsive and cross-browser projects are not configured. |

## Coverage Standard

New E2E tests should:

- Use user-visible selectors such as roles, labels, text, and accessible names.
- Create unique `e2e...` records for destructive coverage.
- Mutate only records created by that test run unless the test explicitly targets a singleton such as site settings.
- Register cleanup when each record is created. Delete every test-created record in `finally` or reliable teardown, deleting dependent records before parents.
- Restore singleton values to their exact pre-test state. Do not silently ignore cleanup failures; report remaining record identifiers and fail the test.
- Avoid mutating the configured login account.
- Set `cms.language` to `en` before flows that rely on English labels.
- Keep assertions tied to user-visible behavior and important API responses.
