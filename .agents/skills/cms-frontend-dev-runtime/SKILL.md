---
name: cms-frontend-dev-runtime
description: CMS frontend dev runtime, local app startup, Vite proxy, backend prerequisite, build, preview, and troubleshooting. Use when starting, checking, or diagnosing the CMS frontend outside Playwright-specific testing.
---

# CMS Frontend Dev Runtime

Use this skill when the task is about starting, stopping, checking, or diagnosing the CMS frontend runtime during local development.

Use the `playwright` skill instead when the task is specifically about browser automation, E2E tests, traces, headed/debug test runs, selectors, screenshots, or Playwright MCP validation.

## Project Runtime

- Frontend stack: React 19, TypeScript, Vite 7, React Router v7 from `react-router`.
- OpenCode-safe frontend dev command: start `npm run dev` in an independent PowerShell window with `Start-Process`.
- Headless background fallback when a separate terminal window is not desired: `npm run dev:bg`.
- Foreground frontend dev command for live terminal logs in the current terminal: `npm run dev`.
- Production build check: `npm run build`.
- Preview command after build: `npm run preview`.
- Frontend dev URLs are normally `http://localhost:5173` and `http://127.0.0.1:5173`.
- Backend must run separately from the sibling backend project.
- Current backend dev target is `http://localhost:8080/cms-app`.

## Vite Proxy

Frontend code must call relative `/api/...` URLs.

Vite proxies local API requests as follows:

```text
/api/... -> http://localhost:8080/cms-app/api/...
```

The proxy also rewrites backend cookies with `cookiePathRewrite: "/"` so session cookies work from the frontend dev origin.

Do not replace frontend API calls with full `localhost` backend URLs.

## Starting The App

For normal OpenCode development on Windows, start Vite in an independent PowerShell window. This returns the OpenCode command promptly while the new terminal keeps the long-running Vite logs visible:

```powershell
Start-Process -FilePath "powershell.exe" -WorkingDirectory (Get-Location).Path -ArgumentList @("-NoExit", "-NoProfile", "-Command", "npm run dev")
```

After `Start-Process` returns, immediately send the final response with the expected URL (`http://127.0.0.1:5173`) and tell the user to stop the dev server with `Ctrl+C` in the opened PowerShell window. Do not run foreground-process, browser, API, or log checks after starting the independent terminal unless the user explicitly requested those checks.

Do not run plain `npm run dev` inside the OpenCode shell unless the user explicitly wants the current OpenCode command to be occupied by live Vite logs.

If an independent terminal window is not available or not desired, use the headless background launcher:

```powershell
npm run dev:bg
```

The script starts Vite detached with `node_modules/vite/bin/vite.js --host 127.0.0.1`, redirects logs to `%TEMP%\opencode`, prints the process ID, detected local URL, log paths, and a `Stop-Process` command. After printing those details, the launcher flushes output and explicitly exits so the shell command should be complete while the detached Vite process keeps running.

OpenCode interaction rule: the user's input prompt returns only after the assistant finishes the turn with a final response. When `npm run dev:bg` prints `CMS frontend dev server started.`, immediately send the final response with the URL and stop command. Do not run foreground-process, browser, API, or log checks after a successful startup unless the user explicitly requested those checks.

Only diagnose processes or logs if `npm run dev:bg` fails, times out, does not print the startup message, or the user explicitly asks for verification. In that diagnostic case, check that no foreground `npm`, `start-dev-bg`, or launcher process remains; the detached Vite process and its build helper children, such as `esbuild.exe`, should be the only CMS frontend runtime processes left running.

Useful Windows process check:

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'cms-frontend|start-dev-bg|vite' } | Select-Object ProcessId,ParentProcessId,Name,CommandLine | Format-List
```

For foreground Vite logs in the current terminal:

```powershell
npm run dev
```

To bind the background server to a different host, pass Vite startup options through npm:

```powershell
npm run dev:bg -- --host 0.0.0.0
```

## Runtime Checks

After startup, check:

- frontend loads at `http://127.0.0.1:5173`
- `/login` renders the login form
- `/api/auth/config` returns `200 OK`
- logged-out `/api/auth/me` may return `401 AUTH_REQUIRED`; this is expected
- protected routes redirect logged-out users to `/login`

For code changes, run:

```powershell
npm run build
```

## Common Issues

- If `/api/...` returns connection errors, verify the backend is running at `http://localhost:8080/cms-app`.
- If login succeeds in backend tools but not the browser, check session cookie path/domain behavior through the Vite proxy.
- If CAPTCHA UI unexpectedly appears or disappears, check `/api/auth/config`.
- If `npm run dev` appears to hang, it is probably running normally; Vite is a long-running foreground process. Use `npm run dev:bg` when the prompt should return.
- If port `5173` is already in use, Vite may choose another port unless one is forced with `--port`.

## When To Use Playwright

Use the `playwright` skill after the app is running when the goal is to validate UI behavior in a browser, run E2E tests, inspect console/network errors, capture traces, or debug interactions.
