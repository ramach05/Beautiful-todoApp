# Contributing

Thanks for the interest! The project moves fast as a solo portfolio, so the
bar for external PRs is high: open an issue first and wait for a green light
before writing code. Bug reports and docs fixes are welcome without that.

## Local setup

Requirements: Node 24 (`.nvmrc`), pnpm 10.15 (`corepack enable`), Docker.

```bash
pnpm install
pnpm start   # creates .env files, starts postgres, resets + migrates + seeds the dev db
```

Full options (mock mode, manual run without the db reset) are in the
[README](README.md#quick-start).

## Before opening a PR

```bash
pnpm lint          # eslint, --max-warnings=0
pnpm format        # prettier
pnpm typecheck     # tsc across all packages
pnpm test          # vitest (web RTL + api on PGlite + shared)
pnpm test:coverage # the same with coverage thresholds enforced
pnpm fsd:check     # steiger: Feature-Sliced Design boundaries in apps/web
pnpm build         # production builds
pnpm test:e2e      # Playwright on prod builds (needs Docker)
```

A pre-commit hook runs lint-staged; commit messages are checked by commitlint
(Conventional Commits): `feat(web): ...`, `fix(api): ...`.

## Architecture rules that matter

- imports point down the FSD layers only, a slice is imported through its
  `index.ts`, cross-slice imports are forbidden — steiger enforces this;
- server state lives in TanStack Query (`entities/*/model`), client-only state
  in Effector (`features/*/model`), filter/search in route search params
  ([ADR-0002](docs/adr/0002-state-management.md));
- api changes go through the shared zod contract in `packages/shared` —
  the same contract generates OpenAPI;
- every logic change ships with its test in the same commit.

Architectural decisions are recorded as [ADRs](docs/adr); propose a new ADR
instead of silently revisiting an accepted one.
