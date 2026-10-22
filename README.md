# Beautiful TodoApp

> ⚠️ Проект в активной фазе переработки: legacy-CRA-версия сохранена под тегом [`v0-legacy`](../../tree/v0-legacy), дальше — монорепо и новый стек (см. roadmap ниже).

Todo-приложение уровня production: монорепо, сквозная типобезопасность, тесты, CI, деплой.

## Стек (_migration in progress_)

| Слой     | Технология                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | React 19, Vite 8, TypeScript 7, TanStack Router/Query, Effector, Tailwind CSS 4 |
| Backend  | Node.js 22, Fastify 5, oRPC, Drizzle ORM, PostgreSQL 17                         |
| Auth     | better-auth (httpOnly cookie)                                                   |
| Качество | Vitest, Playwright, ESLint, Prettier, GitHub Actions, Renovate                  |

## Roadmap

- [x] PR-1: baseline + гигиена репозитория
- [x] PR-2: scaffold монорепо (pnpm + Turborepo, CI)
- [x] PR-3: apps/web — Vite + React 19 + TS
- [x] PR-4: состояние и данные (TanStack Query + Effector, общий zod-контракт)
- [ ] PR-5: apps/api — Fastify + oRPC + Drizzle
- [ ] PR-6: auth (better-auth)
- [ ] PR-7: E2E + наблюдаемость
- [ ] PR-8: финальный README, ADR, деплой

Архитектурные решения документируются в [`docs/adr/`](./docs/adr) по мере появления.
