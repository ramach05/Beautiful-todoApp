# 0005. E2E on production builds with a dedicated database

🇬🇧 **English** | [🇷🇺 Русский](0005-e2e-production-builds.ru.md)

Date: 2026-10-22. Status: accepted.

## Context

E2E runs often spin up dev servers (vite dev, tsx watch) — faster, but they check different
code than what ships to production: dev transpilation instead of `vite build`, without env
flags and real bundles. Databases shared with development make runs unreproducible.

## Decision

The `e2e` package (`@bt/e2e`) runs Playwright on top of artifacts: `vite preview` (port 4174)
and `node dist/index.js` (port 3101) — the `webServer` configuration in `playwright.config.ts`.
A separate database `beautiful_todo_e2e`: `globalSetup` recreates it on every run
(`DROP ... WITH (FORCE)` + `CREATE`), in CI postgres:17 runs as a service container. The
scenarios cover: the anonymous redirect, full CRUD with filters and reloads, logout/login and
data isolation between users.

## Consequences

- The run checks exactly the artifacts that get deployed; env flags (Sentry, API_URL) are
  exercised at production values.
- Database state does not leak between runs; locally it does not conflict with the dev
  database (`beautiful_todo`).
- Cost: `pnpm build` is required before `pnpm test:e2e`, the run is slower than the dev
  variant; Docker/CI is required for postgres.
