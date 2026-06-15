# CMS Frontend

React + TypeScript + Vite frontend for the Java Servlet CMS backend.

## Stack

- React 19
- TypeScript
- Vite
- React Router v7 via the `react-router` package
- plain `fetch` through the shared API client

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8080` and rewrites them to the backend `/cms-app/api` context.
All auth requests use relative paths and include cookies with `credentials: "include"`.
Login and session restore responses include a CSRF token. The frontend keeps this token in auth/session state and the shared API client automatically sends it as `X-CSRF-Token` for `POST`, `PUT`, `PATCH`, and `DELETE` requests.
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

The TypeScript source files include JSDoc comments for the current public API helpers, auth context, route guards, pages, and layout components.

## Routes

- `/login` - login page
- `/` - protected dashboard
- `/users` - ADMIN-only user list
- `/users/new` - ADMIN-only user create form
- `/users/:userId/edit` - ADMIN-only user edit form
- `/pages` - ADMIN-only page list
- `/pages/new` - ADMIN-only page create form
- `/pages/:id/edit` - ADMIN-only page edit form
- `/settings` - protected appearance and preference settings

Authenticated pages render inside the shared app layout:

- header with app name, current `loginName`, and logout button
- navigation links for Dashboard, Users, Pages, and Settings
- main content area for the active route

The Users and Pages navigation items and management routes are available only to authenticated users with the `ADMIN` role.

## Implemented Features

- Session login, logout, and startup session restore
- Common API response envelope handling through `src/api/httpClient.ts`
- CSRF header injection for mutating requests
- User CRUD frontend slice with list, create, edit, soft deactivate flow, frontend sorting, pagination, and confirmation dialog
- Page CRUD frontend slice with list, create, edit, delete, frontend sorting, pagination, confirmation dialog, textarea HTML editing, sanitized preview, and simple insert toolbar
- Role-based frontend authorization for user and page management
- Settings page backed by localStorage preferences
- English/Hungarian UI labels
- Configurable themes, including light, vivid, semidark, and dark options
- Configurable navigation layout and behavior
- Optional header date/time, date format, density, striped tables, table page size, content width, font size, button size, reduced motion, and button icons

## Backend Dependency

The backend must expose:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`
- `GET /api/pages`
- `GET /api/pages/{id}`
- `GET /api/pages/slug/{slug}`
- `POST /api/pages`
- `PUT /api/pages/{id}`
- `DELETE /api/pages/{id}`

Session authentication is cookie based, so requests must be made through the same dev origin via the Vite proxy. State-changing requests also require the latest CSRF token from the authenticated session.
