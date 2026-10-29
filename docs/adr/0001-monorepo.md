# 0001. Monorepo on pnpm workspaces + Turborepo

🇬🇧 **English** | [🇷🇺 Русский](0001-monorepo.ru.md)

Date: 2026-10-22. Status: accepted.

## Context

The project was being rebuilt from a CRA app into a fullstack one: an SPA, an HTTP api and
shared type contracts. Placement options: separate repositories, a monorepo with no build
tooling, or pnpm workspaces + Turborepo.

## Decision

One repository with pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`,
`packages/config`, `e2e`. Shared zod contracts and types live in `@bt/shared`, dependencies
are declared only through `workspace:*`. Caching and incremental builds/checks come from
Turborepo (`build`/`typecheck`/`lint`/`test`); `typecheck` has `dependsOn: ["^build"]` — the
types of dependency packages are taken from their `dist`.

## Consequences

- Contract types exist in exactly one place; client/server drift becomes a compile error.
- Shared configs (eslint/typescript/prettier) are published as `@bt/config` and not duplicated.
- Cost: a coupled release cycle and a mandatory `build` before `typecheck`; Node/pnpm versions
  are pinned (`engines`, `packageManager`, nvm).
