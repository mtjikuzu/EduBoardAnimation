# TanStack Start Migration Guide

## Current state

The TanStack Start app structure is set up at `apps/eduwb-start/` with:
- File-based routing (`app/routes/`)
- Server functions (`app/lib/server-fns.ts`)
- Route components, auth, and shared libraries

**Blocked by version conflict:** TanStack Start 1.168.x depends on `h3@2.x` (`h3-v2`), but Vinxi 0.5.x pins `h3@1.x`. This causes a runtime error where `H3Event` receives an incompatible request format.

## Migration steps (once versions align)

### 1. Update dependencies
```bash
pnpm add -w @tanstack/react-start@latest @tanstack/react-router@latest vinxi@latest
```

Ensure `h3` versions are compatible (check `node_modules/.pnpm/` for conflicts).

### 2. Remove the Express API server
```bash
rm -rf artifacts/api-server
```

### 3. Move server logic into server functions
- `artifacts/api-server/src/routes/*` → `apps/eduwb-start/app/lib/server-fns.ts`
- `artifacts/api-server/src/renderer/*` → `apps/eduwb-start/app/lib/renderer/`
- Auth middleware → server function validator/session helpers

### 4. Move frontend pages
- `artifacts/edu-whiteboard/src/pages/*` → `apps/eduwb-start/app/routes/*`
- Use `createFileRoute('/path')({ component: ... })` for each page
- Components stay in `apps/eduwb-start/app/components/`

### 5. Update all imports
- `@workspace/db` → direct drizzle imports
- `@workspace/api-zod` → inline Zod schemas
- Switch from `wouter` to `@tanstack/react-router` navigation

### 6. Remove dev-mode proxy
The Vite proxy on `artifacts/edu-whiteboard/vite.config.ts` is no longer needed since TanStack Start handles both client and server.

## Architecture notes

- **Server functions** (`createServerFn`) replace Express route handlers
- **File-based routing** replaces `wouter`/React Router config
- **SSR** is handled by `createStartHandler` with `defaultStreamHandler`
- **Auth** should use Clerk's TanStack Start integration
- **DB access** goes through server functions only (never client-side)

## Current working setup

Until the version issue is resolved, the application runs on:

| Component | Location | Port |
|-----------|----------|------|
| Express API | `artifacts/api-server/` | 5000 |
| React SPA | `artifacts/edu-whiteboard/` | 5173 |
| PostgreSQL | Docker (`church-db`) | 5432 |
