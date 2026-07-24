# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

### Prerequisites
- PostgreSQL 16+ (or Docker with `church-db` container on port 5432)
- Node.js 22+, pnpm 10+

### Quick start

```bash
# 1. Set up database
export DATABASE_URL="postgres://church:church@localhost:5432/eduwb"

# 2. Push schema
pnpm --filter @workspace/db run push-force

# 3. Start API server (terminal 1)
export PORT=5000 && pnpm --filter @workspace/api-server run start

# 4. Start frontend (terminal 2)
export PORT=5173 BASE_PATH="/" API_URL="http://localhost:5000" && \
  pnpm --filter @workspace/edu-whiteboard run dev
# Frontend: http://localhost:5173/ | API: http://localhost:5000/api/healthz
```

### Seed test data

```bash
# Create a creator
curl -X POST http://localhost:5000/api/creators/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","name":"Ms. Smith"}'

# Create a lesson and generate storyboard (use the returned creator ID)
curl -X POST http://localhost:5000/api/lessons \
  -H "X-Dev-Creator-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Lesson","grade":"Grade 10","language":"English"}'

# Grant trial credits
curl -X POST http://localhost:5000/api/credits/mock-checkout \
  -H "X-Dev-Creator-Id: 1" \
  -d '{"amount":200}'
```

### Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
