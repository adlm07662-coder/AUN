# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack AI platform with authentication, image/video generation, chat AI, and a feature-rich public frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (image gen, chat, etc.)
- **Auth**: Custom JWT-based auth (bcryptjs + jsonwebtoken)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project Structure

### Artifacts
- `artifacts/api-server/` — Express API server + static HTML/JS frontend (the whole app), served from the root preview path with API routes under `/api`
  - `src/routes/` — all API routes (auth, chat, generation, admin, billing, etc.)
  - `public/` — static frontend (HTML pages + JS modules)
  - `public/js/` — 80+ frontend JS modules (ai-engine, agents, chat, etc.)

### Logo / Branding
- **AUN Logo** is defined in static HTML inside `#genTopBar` in `public/index.html` (line ~13427) as `#aunHomeLogo`
- Uses inline SVG: neon hexagon outline, dual-hemisphere brain, neural nodes, energy rays
- Typography: Orbitron (Google Fonts, weights 700/900), stacked "Ai/U/Need" spans
- Colors: electric cyan (#00FFFF), blue (#00BFFF), violet (#8A2BE2)
- **Critical CSS conflict**: `#genTopBar svg { display: none !important }` and repeated `all: unset !important` blocks in index.html strip all button/SVG styles. Fixed by:
  - Adding `id="aunHomeLogo"` for high-specificity CSS override
  - High-specificity CSS at end of file: `#genTopBar #aunHomeLogo svg { display: block !important }`
  - The `stripNavFrame()` setInterval (every 300ms, defined ~line 17048) now explicitly re-applies logo inline styles each tick and skips #aunHomeLogo in the generic stripping loop
  - `plainTopNavOnly()` MutationObserver (defined ~line 17006) also skips #aunHomeLogo

### Lib Packages
- `lib/db/` — Drizzle ORM schema + DB connection (users table + schema)
- `lib/api-spec/` — OpenAPI spec + Orval codegen config
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas
- `lib/integrations-openai-ai-server/` — Server-side OpenAI client (image, audio, batch). The app can start without AI credentials; AI endpoints require `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` at request time.
- `lib/integrations-openai-ai-react/` — React-side audio hooks

## Environment Secrets
- `DATABASE_URL`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGHOST` — PostgreSQL
- `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI via Replit AI Integrations
- `SESSION_SECRET` — Session signing

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
