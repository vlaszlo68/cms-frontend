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
- `/media` - ADMIN-only media library
- `/menus` - ADMIN-only menu list
- `/menus/new` - ADMIN-only menu create form
- `/menus/:id/edit` - ADMIN-only menu edit form
- `/menus/:id/items` - ADMIN-only menu item management
- `/settings` - protected appearance and preference settings

Authenticated pages render inside the shared app layout:

- header with app name, current `loginName`, and logout button
- navigation links for Dashboard, Users, Pages, Menus, Media, and Settings
- main content area for the active route

The Users, Pages, Menus, and Media navigation items and management routes are available only to authenticated users with the `ADMIN` role.

## Implemented Features

- Session login, logout, and startup session restore
- Common API response envelope handling through `src/api/httpClient.ts`
- CSRF header injection for mutating requests
- User CRUD frontend slice with list, create, edit, soft deactivate flow, frontend sorting, pagination, and confirmation dialog
- Page CRUD frontend slice with list, create, edit, delete, frontend sorting, pagination, confirmation dialog, textarea HTML editing, sanitized preview, and simple insert toolbar
- Media library frontend slice with upload, list, details modal, content preview, delete confirmation, frontend sorting, and pagination
- Menu CRUD frontend slice with menu item management, Page relationships, parent selection, ordering, visibility, and `PAGE`/`URL` target UI
- Draggable modal dialogs for confirmations, upload, media details, and media preview
- Role-based frontend authorization for user, page, menu, and media management
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
- `GET /api/media`
- `GET /api/media/{id}`
- `GET /api/media/{id}/content`
- `POST /api/media`
- `DELETE /api/media/{id}`
- `GET /api/menus`
- `GET /api/menus/{id}`
- `POST /api/menus`
- `PUT /api/menus/{id}`
- `DELETE /api/menus/{id}`
- `GET /api/menus/{id}/items`
- `POST /api/menu-items`
- `PUT /api/menu-items/{id}`
- `DELETE /api/menu-items/{id}`

Session authentication is cookie based, so requests must be made through the same dev origin via the Vite proxy. State-changing requests also require the latest CSRF token from the authenticated session.

## Menu Item Targets

Menu items support two frontend target types:

- `PAGE`: requires `pageId`; options are loaded from the Pages API
- `URL`: requires `targetUrl`; the target is entered as an external URL

The editor defaults to `PAGE` and dynamically switches between the Page selector and Target URL field. Requests include `targetType` and send the inactive target field as `null`.

Current backend note: the backend DTO/model contains `MenuItemTargetType`, `targetType`, and `targetUrl`, but the locally inspected `MenuItemService` still requires `pageId` and does not yet persist URL target fields. Backend service support must be completed before URL menu items can be saved end to end.
