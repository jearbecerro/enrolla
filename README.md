# Enrolla Quiz Monorepo

A pnpm workspaces monorepo containing:
- `quiz-app` – Next.js App Router frontend
- `server` – Hono backend (Cloudflare Workers compatible; Node dev server)
- `shared` – Shared logic, schemas, validator, data, and tests

GitHub:
- https://github.com/jearbecerro/enrolla.git

## Quick Start

### Prerequisites
- Node 20+
- pnpm 9+

### Install
```bash
pnpm -w install
```

### Development (frontend + backend concurrently)
```bash
# root of the repo
pnpm -w dev
```
- Frontend: http://localhost:3000
- Backend (Node dev server): http://127.0.0.1:8787

Set environment variables for local dev:
- `quiz-app/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
```
- `server/.env`
```bash
FRONTEND_URL=http://localhost:3000
PORT=8787
```

### Build
```bash
# build all workspaces
pnpm -w build

# deploy Hono Cloudflare Worker (requires wrangler auth)
pnpm --filter server deploy
```

### Tests (shared package)
```bash
pnpm --filter shared test
```

## Architecture Notes

- **Frontend**: Next.js 14 App Router, client components where needed. Global state via Zustand. API calls go directly to the Hono backend (no Next API routes in production path).
- **Backend**: Hono (Cloudflare Workers compatible). In dev, `@hono/node-server` serves on port 8787. In production/Workers, `c.env` provides bindings.
- **Runtime**: Node in local development; Edge/Workers compatible for deployment. CORS is enforced in the Hono app.
- **Environment variables**:
  - Backend reads `FRONTEND_URL` from `context.env.FRONTEND_URL` (Workers) or falls back to `'http://localhost:3000'` in dev.
  - Frontend reads `NEXT_PUBLIC_API_URL` for the Hono base URL.
- **Shared package**: Contains Zod schemas, validators, the grading logic, and the in-memory `QUESTION_BANK` used by both server and tests.

## Validation Approach

- **Zod schemas** (`shared/src/schemas.ts`) define the shape for:
  - `BackendQuestion` (text/radio/checkbox), `backendQuizResponseSchema`
  - Grade request/response
- **Validators** (`shared/src/validator.ts`) perform:
  - `validateBackendQuiz` – sanity checks for question bank at server startup
  - `validateGradeRequest` – runtime validation of submissions
- **Tests**: Jest + ts-jest cover schemas, validators, and grading logic.

## Libraries Used & Rationale

- **Next.js (App Router)**: Modern routing, good DX, SSR/ISR capable if needed.
- **React 18**: UI composition.
- **Zustand**: Minimal global state with great ergonomics.
- **Hono**: Lightweight, fast, and Cloudflare Workers friendly HTTP server framework.
- **Zod**: Runtime validation and static type inference.
- **Jest + ts-jest**: Unit testing for shared logic.
- **Tailwind CSS**: Rapid UI styling, includes dark code block styling.

## Trade-offs & Shortcuts

- **In-memory data**: `QUESTION_BANK` is bundled; no DB persistence. Good for demo; swap to a DB for production.
- **Simple CORS**: Single-origin configured via `FRONTEND_URL`. For multi-origin, extend to a whitelist.
- **No SSR data fetching**: Frontend uses client-side fetch to Hono backend for simplicity.
- **Testing config warnings**: Using `globals` for ts-jest shows deprecation warnings; kept for speed—can be migrated to the recommended `transform` config later.
- **Accessibility and i18n**: Basic coverage; could be expanded.

## Honest Time Spent

- Initial setup (monorepo, shared, Jest): ~1.5 hours
- Quiz UI (normal + timed), state, styling: ~4 hours
- Validation & error handling: ~1 hour
- Hono backend integration & CORS: ~1 hour
- Refactors (types, naming, util extraction), fixes: ~2 hours
- Tests adjustments & green suite: ~0.5 hour

Total: ~10 hours

## Project Structure

```
.
├─ quiz-app/            # Next.js frontend (App Router)
│  ├─ app/
│  ├─ components/
│  └─ lib/
├─ server/              # Hono backend (Workers + Node dev)
│  ├─ src/
│  └─ wrangler.toml
├─ shared/              # Shared logic, schemas, data, tests
│  └─ src/
└─ pnpm-workspace.yaml
```

## Deployment Notes

- Deploy Hono to Cloudflare Workers (`pnpm --filter server deploy`). Set `FRONTEND_URL` in Workers environment.
- Deploy Next.js app to Vercel/Node. Set `NEXT_PUBLIC_API_URL` to the Hono endpoint.
