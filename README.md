# CMS Frontend

React + TypeScript + Vite frontend for the Java Servlet CMS backend.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8081`.
All auth requests use relative paths and include cookies with `credentials: "include"`.
API responses use the common backend envelope:

```json
{
  "success": true,
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

The frontend API client unwraps successful `data` values and exposes backend `error.message` values through the shared `ApiError` class.

## Routes

- `/login` - login page
- `/` - protected dashboard
- `/users` - protected users placeholder
- `/pages` - protected pages placeholder

Authenticated pages render inside the shared app layout:

- header with app name, current `loginName`, and logout button
- navigation links for Dashboard, Users, and Pages
- main content area for the active route

## Backend Dependency

The backend must expose:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Session authentication is cookie based, so requests must be made through the same dev origin via the Vite proxy.
