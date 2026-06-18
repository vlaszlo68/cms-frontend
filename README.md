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
- `/pages/:id/blocks` - ADMIN-only PageBlock list
- `/pages/:id/blocks/new` - ADMIN-only PageBlock create form
- `/pages/:id/blocks/:blockId/edit` - ADMIN-only PageBlock edit form
- `/media` - ADMIN-only media library
- `/menus` - ADMIN-only menu list
- `/menus/new` - ADMIN-only menu create form
- `/menus/:id/edit` - ADMIN-only menu edit form
- `/menus/:id/items` - ADMIN-only menu item management
- `/templates` - ADMIN-only template list
- `/templates/new` - ADMIN-only template create form
- `/templates/:id/edit` - ADMIN-only template edit form
- `/site-settings` - ADMIN-only public site settings
- `/settings` - protected appearance and preference settings

Authenticated pages render inside the shared app layout:

- header with app name, current `loginName`, and logout button
- navigation links for Dashboard, Users, Pages, Menus, Templates, Media, Site Settings, and Settings
- main content area for the active route

The Users, Pages, Menus, Templates, Media, and Site Settings navigation items and management routes are available only to authenticated users with the `ADMIN` role.

## Implemented Features

- Session login, logout, and startup session restore
- Common API response envelope handling through `src/api/httpClient.ts`
- CSRF header injection for mutating requests
- User CRUD frontend slice with list, create, edit, soft deactivate flow, frontend sorting, pagination, and confirmation dialog
- Page CRUD frontend slice with list, create, edit, delete, frontend sorting, pagination, confirmation dialog, textarea HTML editing, sanitized preview, and simple insert toolbar
- Page type support with `CONTENT` and `BLOCK` modes
- PageBlock CRUD with ordered blocks, visibility, block type, and raw Config JSON editing
- Media library frontend slice with upload, list, details modal, content preview, delete confirmation, frontend sorting, and pagination
- Menu CRUD frontend slice with menu item management, Page relationships, parent selection, ordering, visibility, and `PAGE`/`URL` target UI
- Template CRUD with Media-based preview image selection
- Site Settings editor with Media-based logo selection and public contact/social fields
- Page template selection with `STANDARD` as the frontend default
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
- `GET /api/pages/{id}/blocks`
- `GET /api/page-blocks/{id}`
- `POST /api/page-blocks`
- `PUT /api/page-blocks/{id}`
- `DELETE /api/page-blocks/{id}`
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
- `GET /api/templates`
- `GET /api/templates/{id}`
- `POST /api/templates`
- `PUT /api/templates/{id}`
- `DELETE /api/templates/{id}`
- `GET /api/site-settings`
- `PUT /api/site-settings`

Session authentication is cookie based, so requests must be made through the same dev origin via the Vite proxy. State-changing requests also require the latest CSRF token from the authenticated session.

## Menu Item Targets

Menu items support two frontend target types:

- `PAGE`: requires `pageId`; options are loaded from the Pages API
- `URL`: requires `targetUrl`; the target is entered as an external URL

The editor defaults to `PAGE` and dynamically switches between the Page selector and Target URL field. Requests include `targetType` and send the inactive target field as `null`.

Current backend note: the backend DTO/model contains `MenuItemTargetType`, `targetType`, and `targetUrl`, but the locally inspected `MenuItemService` still requires `pageId` and does not yet persist URL target fields. Backend service support must be completed before URL menu items can be saved end to end.

## Page Types And Blocks

Pages use `pageType: "CONTENT" | "BLOCK"`:

- `CONTENT` shows the existing HTML textarea, toolbar, and sanitized preview.
- `BLOCK` hides the content editor and exposes a Blocks action on the Pages list.

PageBlock `configJson` is intentionally handled as raw editable text. The frontend does not parse it or provide drag-and-drop, preview, or a visual builder.

## Backend Work In Progress

Template, Site Settings, Page template selection, PageType, and PageBlock frontend contracts are implemented while the corresponding backend is being developed. Current assumptions are:

- Page template field: `templateCode`
- Page type field: `pageType`
- Template API: `/api/templates`
- Site Settings API: `/api/site-settings`
- PageBlock list: `/api/pages/{pageId}/blocks`
- PageBlock item CRUD: `/api/page-blocks`
