---
name: playwright
description: Playwright tests, Playwright MCP browser automation, and this CMS frontend E2E suite. Use when writing, debugging, or running browser tests, UI flows, selectors, screenshots, traces, headed/debug runs, or CMS auth/admin CRUD checks.
---

# Playwright

Use this skill for browser automation, UI flow checks, Playwright test authoring, Playwright debugging, selector work, screenshots, traces, and Playwright MCP driven validation.

## Project Context

- This repository is a React 19 + Vite frontend.
- Prefer checking the existing source and routing before assuming URLs, labels, or roles.
- For Playwright MCP or manual browser automation, start the app with the OpenCode-safe runtime pattern below instead of a foreground `npm run dev`.
- For `npm run test:e2e*`, let Playwright's `webServer` manage Vite; it runs `npm run dev -- --host 127.0.0.1 --port $PLAYWRIGHT_PORT` and reuses an existing server.
- Use `npm run build` as the baseline verification command after code changes.
- Backend API calls go through Vite's relative `/api` proxy to the CMS backend.
- Authenticated E2E tests require `PLAYWRIGHT_LOGIN_NAME` and `PLAYWRIGHT_PASSWORD`; use `tester` / `pw` by default unless the user provides other credentials.
- The backend must be running for E2E tests that touch `/api`.

## App Startup For Browser Work

When a Playwright MCP or ad hoc browser session needs the CMS frontend running, start Vite in an independent PowerShell window so OpenCode does not get occupied by long-running dev logs:

```powershell
Start-Process -FilePath "powershell.exe" -WorkingDirectory (Get-Location).Path -ArgumentList @("-NoExit", "-NoProfile", "-Command", "npm run dev")
```

Expected local URL: `http://127.0.0.1:5173`.

Stop it with `Ctrl+C` in the opened PowerShell window.

If a separate terminal window is not desired, use the detached launcher:

```powershell
npm run dev:bg
```

After `dev:bg` prints the process ID, stop it with the printed `Stop-Process` command. Use a foreground `npm run dev` only when the user explicitly wants live Vite logs in the current terminal.

## Browser Automation

- Prefer user-visible selectors such as roles, labels, text, placeholders, and accessible names.
- Avoid brittle selectors based on generated class names, deep DOM structure, or styling-only wrappers.
- When checking auth or protected pages, reason through session state, redirects, CSRF behavior, and API proxy assumptions.
- Capture screenshots or traces only when they help diagnose a visual or flow issue.

## Test Authoring

- Keep tests focused on user-visible behavior instead of implementation details.
- Arrange tests around realistic navigation and form interaction.
- Use stable expectations for labels, route changes, validation messages, and visible UI states.
- Prefer small, readable tests over broad end-to-end scripts that are hard to diagnose.
- Keep CMS admin CRUD tests isolated by creating unique `e2e...` records.

## CMS E2E Commands

When the user asks to run any CMS Playwright test command, always set the configured credentials in the same PowerShell command before the test command. This applies to `npm run test:e2e*`, `npx playwright test`, individual spec files, `--headed`, `--debug`, and trace runs. Do not run a bare Playwright test command unless the user explicitly asks to omit credentials or to run only unauthenticated tests.

For OpenCode's PowerShell bash tool, prefer one-line commands with semicolons so the environment variables apply to the test process:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e:headed
```

Run all E2E tests from PowerShell:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e
```

Run with trace for every test:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e:trace
```

Run with a visible browser:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e:headed
```

Run in interactive debug mode:

```powershell
$env:PLAYWRIGHT_LOGIN_NAME="tester"; $env:PLAYWRIGHT_PASSWORD="pw"; npm run test:e2e:debug
```

Open a saved trace:

```powershell
npx playwright show-trace test-results\...\trace.zip
```

## Current CMS E2E Coverage

- `e2e/auth-captcha-disabled.spec.ts`: verifies captcha-disabled login/register UI and `/api/auth/config`.
- `e2e/authenticated-smoke.spec.ts`: logs in and opens every visible navigation screen.
- `e2e/admin-user-crud.spec.ts`: creates, edits, and deactivates a user.
- `e2e/admin-page-crud.spec.ts`: creates, edits, and deletes a page.
- `e2e/admin-menu-crud.spec.ts`: creates, edits, and deletes a menu.
- `e2e/admin-helpers.ts`: shared login, admin navigation, table row lookup, and error checks.

## CMS E2E Notes

- User deletion in the current UI is deactivation; assert `active = No` and disabled `Deactivate` button.
- Page and Menu deletion remove the row from the list.
- Admin CRUD tests should skip cleanly when the configured account is not ADMIN.
- Set `cms.language` to `en` in tests before navigation when relying on English labels.
- The table page size can be set with `cms.tablePageSize = 100` to reduce pagination noise.
- If row lookup flakes after create/update, inspect whether the list has finished reloading before asserting.
