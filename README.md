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

## Routes

- `/login` - login page
- `/` - protected dashboard placeholder

## Backend Dependency

The backend must expose:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Session authentication is cookie based, so requests must be made through the same dev origin via the Vite proxy.
