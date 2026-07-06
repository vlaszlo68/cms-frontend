# Project Notes

## Purpose

This repository contains the independent React frontend for the CMS backend. The backend is developed separately and exposes servlet based JSON endpoints under `/api`.

The frontend owns its Node toolchain, Vite build, routing, auth state, preferences, API wrappers, and deployment artifacts.

## Stack

- React 19
- TypeScript
- Vite 7
- React Router v7 from the `react-router` package
- Plain `fetch` through a shared API client
- Browser cookie based session authentication

Package scripts:

```bash
npm run dev
npm run build
npm run preview
```

`npm run build` runs `tsc -b && vite build`. No test runner, linter, or formatter is configured yet.

## Runtime And Proxy

Current frontend dev URLs:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Current verified backend deployment:

```text
http://localhost:8080/cms-app
```

Current `vite.config.ts` proxy behavior:

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
      cookiePathRewrite: "/",
      rewrite: (path) => path.replace(/^\/api/, "/cms-app/api"),
    },
  },
}
```

Frontend code intentionally calls relative `/api/...` paths only. Do not put full backend hostnames in `fetch` calls.

## API Conventions

All normal backend API responses use the common envelope:

```ts
type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        validationErrors?: string[];
      };
    };
```

`src/api/httpClient.ts` is responsible for:

- sending `credentials: "include"`
- JSON request serialization
- multipart form uploads through `apiPostForm`
- response envelope validation and unwrapping
- throwing `ApiError` with backend `message`, `code`, and optional `validationErrors`
- attaching `X-CSRF-Token` for `POST`, `PUT`, `PATCH`, and `DELETE`
- skipping CSRF for `GET`, `HEAD`, `OPTIONS`, and explicit public POSTs
- notifying auth state when a protected API returns `401 AUTH_REQUIRED`

`403 CSRF_INVALID` remains an API error path. The frontend must not manipulate backend session cookies.

## Auth And Registration

Implemented auth files:

- `src/api/authApi.ts`
- `src/api/authSession.ts`
- `src/auth/AuthContext.tsx`
- `src/auth/passwordPolicy.ts`
- `src/auth/useCaptchaChallenge.ts`
- `src/components/auth/CaptchaField.tsx`
- `src/components/auth/PasswordRequirements.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`

Auth flow:

1. Startup calls `GET /api/auth/me`.
2. A successful response hydrates `AuthContext` and stores the returned CSRF token in memory.
3. `401 AUTH_REQUIRED` clears frontend user and CSRF state.
4. Login submits `loginName`, `password`, and optional CAPTCHA fields to `POST /api/auth/login`.
5. Registration submits public account data and optional CAPTCHA fields to `POST /api/auth/register`; it does not establish a session.
6. Logout calls `POST /api/auth/logout` with the current CSRF token and then clears local auth state.

Public auth support:

- `GET /api/auth/config` returns login CAPTCHA, registration CAPTCHA, and password policy settings.
- `GET /api/auth/captcha?purpose=login|registration` returns SVG text and the CAPTCHA id in the `X-Captcha-Id` header.
- Login and registration forms include a hidden CAPTCHA honeypot field when submitting CAPTCHA data.
- Registration validates password requirements locally from the backend-provided policy and also surfaces backend `validationErrors`.

Auth payload types:

```ts
type AuthUser = {
  id: number;
  loginName: string;
  email: string;
  role: "ADMIN" | "USER";
};

type AuthSession = AuthUser & {
  csrfToken: string;
};
```

## Routing

Current routes:

- `/login`: public-only login page
- `/register`: public-only registration page
- `/`: protected dashboard
- `/users`: ADMIN-only user list
- `/users/new`: ADMIN-only user create form
- `/users/:userId/edit`: ADMIN-only user edit form
- `/pages`: ADMIN-only page list
- `/pages/new`: ADMIN-only page create form
- `/pages/:id/edit`: ADMIN-only page edit form
- `/pages/:id/blocks`: ADMIN-only PageBlock list
- `/pages/:id/blocks/new`: ADMIN-only PageBlock create form
- `/pages/:id/blocks/:blockId/edit`: ADMIN-only PageBlock edit form
- `/media`: ADMIN-only media library
- `/menus`: ADMIN-only menu list
- `/menus/new`: ADMIN-only menu create form
- `/menus/:id/edit`: ADMIN-only menu edit form
- `/menus/:id/items`: ADMIN-only menu item management
- `/templates`: ADMIN-only template list
- `/templates/new`: ADMIN-only template create form
- `/templates/:id/edit`: ADMIN-only template edit form
- `/site-settings`: ADMIN-only public site settings
- `/settings`: protected appearance and preference settings
- `*`: redirect to `/`

Authenticated pages render inside `src/components/layout/AppLayout.tsx`. Navigation shows Dashboard and Settings for authenticated users, and Users, Pages, Menus, Templates, Media, and Site Settings only for ADMIN users.

## Implemented Feature Slices

### Users

Files:

- `src/models/user.ts`
- `src/api/userApi.ts`
- `src/pages/UsersPage.tsx`
- `src/pages/UserFormPage.tsx`

Implemented API helpers:

```ts
getUsers(): Promise<User[]>
getUser(id: number): Promise<User>
createUser(input: CreateUserRequest): Promise<User>
updateUser(id: number, input: UpdateUserRequest): Promise<User>
deleteUser(id: number): Promise<User>
approveUser(id: number): Promise<User>
rejectUser(id: number): Promise<User>
```

User model fields include `loginName`, `userName`, `emailAddress`, `role`, `active`, `registrationStatus`, `createdAt`, and `updatedAt`. Registration statuses are `PENDING`, `EMAIL_VERIFICATION_REQUIRED`, `COMPLETED`, and `REJECTED`.

### Pages And Blocks

Files:

- `src/models/page.ts`
- `src/models/pageBlock.ts`
- `src/api/pageApi.ts`
- `src/api/pageBlockApi.ts`
- `src/pages/PagesPage.tsx`
- `src/pages/PageFormPage.tsx`
- `src/pages/PageBlocksPage.tsx`
- `src/pages/PageBlockFormPage.tsx`

Pages use:

```ts
type PageType = "CONTENT" | "BLOCK";
type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
```

Page fields include `templateCode` and `pageType`. `CONTENT` pages show the HTML textarea, insert toolbar, and sanitized preview. `BLOCK` pages hide the content editor and expose block management from the page list.

PageBlock `configJson` is raw editable text. There is no drag-and-drop ordering, visual builder, schema validation, or block preview.

### Media

Files:

- `src/models/media.ts`
- `src/api/mediaApi.ts`
- `src/pages/MediaPage.tsx`
- `src/components/media/MediaUploadDialog.tsx`

Media supports list, details, multipart upload, confirmed hard delete, and content preview through `/api/media/{id}/content`. Images render inline, PDFs render in an iframe, and unsupported file types provide an open-content link.

### Menus

Files:

- `src/models/menu.ts`
- `src/api/menuApi.ts`
- `src/pages/MenusPage.tsx`
- `src/pages/MenuFormPage.tsx`
- `src/pages/MenuItemsPage.tsx`

Menu items use:

```ts
type MenuItemTargetType = "PAGE" | "URL";
```

The editor supports parent items, ordering, visibility, Page targets, and URL target form state. Requests include `targetType` and clear the inactive target field with `null`.

Known backend compatibility note: frontend models and UI support URL targets, but backend service support must be verified before URL menu items are considered complete end to end.

### Templates And Site Settings

Files:

- `src/models/template.ts`
- `src/api/templateApi.ts`
- `src/pages/TemplatesPage.tsx`
- `src/pages/TemplateFormPage.tsx`
- `src/models/siteSettings.ts`
- `src/api/siteSettingsApi.ts`
- `src/pages/SiteSettingsPage.tsx`

Templates support CRUD, `code`, `name`, optional `description`, optional Media preview image id, and `active`.

Site Settings manages site name, optional Media logo id, footer text, contact email, phone, Facebook URL, and LinkedIn URL.

### Preferences And I18n

Files:

- `src/preferences/PreferencesContext.tsx`
- `src/i18n/translations.ts`
- `src/pages/SettingsPage.tsx`
- `src/components/ui/ButtonLabel.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/DraggableDialog.tsx`

Preferences persist in `localStorage` and apply immediately. Current options include:

- language: `en`, `hu`
- theme: `classic`, `forest`, `wine`, `graphite`, `lagoon`, `sunrise`, `dusk`, `harbor`, `ember`, `cinder`, `midnight`, `aurora`
- navigation layout: `sidebar`, `horizontal`
- navigation behavior: `fixed`, `floating`, `peek`
- density: `compact`, `normal`, `comfortable`
- date format: `short`, `long`
- content width: `full`, `centered`
- button size: `normal`, `compact`
- font size: `normal`, `compact`
- table page size: `10`, `20`, `50`, `100`
- booleans for header date, header time, striped tables, reduced motion, and button icons

## Backend Endpoint Dependency

The frontend currently depends on these backend endpoints:

```text
GET  /api/auth/config
GET  /api/auth/captcha?purpose=login|registration
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/register

GET    /api/users
GET    /api/users/{id}
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
POST   /api/users/{id}/approve
POST   /api/users/{id}/reject

GET    /api/pages
GET    /api/pages/{id}
GET    /api/pages/slug/{slug}
POST   /api/pages
PUT    /api/pages/{id}
DELETE /api/pages/{id}

GET    /api/pages/{pageId}/blocks
GET    /api/page-blocks/{id}
POST   /api/page-blocks
PUT    /api/page-blocks/{id}
DELETE /api/page-blocks/{id}

GET    /api/media
GET    /api/media/{id}
GET    /api/media/{id}/content
POST   /api/media
DELETE /api/media/{id}

GET    /api/menus
GET    /api/menus/{id}
POST   /api/menus
PUT    /api/menus/{id}
DELETE /api/menus/{id}
GET    /api/menus/{id}/items
POST   /api/menu-items
PUT    /api/menu-items/{id}
DELETE /api/menu-items/{id}

GET    /api/templates
GET    /api/templates/{id}
POST   /api/templates
PUT    /api/templates/{id}
DELETE /api/templates/{id}

GET /api/site-settings
PUT /api/site-settings
```

## Backend Contracts Under Development

The Template, Site Settings, Page template, PageType, PageBlock, registration approval, CAPTCHA, and password-policy contracts should be reconciled against the backend as they settle.

Current frontend assumptions:

- auth config endpoint: `/api/auth/config`
- CAPTCHA endpoint: `/api/auth/captcha?purpose=login|registration`
- registration endpoint: `/api/auth/register`
- user approval endpoints: `/api/users/{id}/approve` and `/api/users/{id}/reject`
- page template field: `templateCode`
- page type field: `pageType`
- template API: `/api/templates`
- site settings API: `/api/site-settings`
- PageBlock list: `/api/pages/{pageId}/blocks`
- PageBlock item CRUD: `/api/page-blocks`
- Menu item target fields: `targetType`, `pageId`, `targetUrl`

Update the API wrappers and model files first when the backend contract changes, then adjust pages and this document.
