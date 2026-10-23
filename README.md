# Beautiful TodoApp

![CI](https://github.com/ramach05/Beautiful-todoApp/actions/workflows/ci.yml/badge.svg?branch=main)

Todo-приложение уровня production: монорепо, сквозная типобезопасность от БД до кнопок в UI, авторизация, тесты, CI, наблюдаемость. Legacy-CRA-версия сохранена под тегом [`v0-legacy`](../../tree/v0-legacy).

![Демо потока работы](./docs/images/todo-flow.gif)

## Возможности

- регистрация и вход (email + пароль), сессия в httpOnly-cookie, переживает перезагрузку;
- задачи пользователя: создание, completion, приоритет, удаление, поиск, фильтры (All / Active / Done);
- данные изолированы по владельцу — каждый видит только свои задачи;
- адаптивная верстка, состояние сохраняется в PostgreSQL.

|                                           |                                               |
| ----------------------------------------- | --------------------------------------------- |
| ![Основной экран](./docs/images/main.png) | ![Мобильная версия](./docs/images/mobile.png) |

## Стек

| Слой          | Технологии                                                                      |
| ------------- | ------------------------------------------------------------------------------- |
| Frontend      | React 19, Vite 8, TypeScript 6, TanStack Router/Query, Effector, Tailwind 4     |
| Backend       | Node.js 24, Fastify 5, oRPC, Drizzle ORM, PostgreSQL 17                         |
| Auth          | better-auth (email+password, httpOnly cookie)                                   |
| Контракт      | zod-схемы в `packages/shared`: один источник типов для клиента и сервера        |
| Качество      | Vitest, Testing Library, Playwright, ESLint, Prettier, GitHub Actions, Renovate |
| Наблюдаемость | Sentry (env-gated), request-id сквозной FE→BE                                   |

## Архитектура

```mermaid
flowchart LR
  web[apps/web<br/>React 19 + Vite] -- oRPC /rpc --> api[apps/api<br/>Fastify 5 + oRPC]
  web -- better-auth /api/auth --> api
  api -- Drizzle --> pg[(PostgreSQL 17)]
```

- Серверное состояние — TanStack Query (оптимистичные мутации), клиентское (фильтры, сессия) — Effector, маршрутизация — TanStack Router с guard'ом авторизации.
- oRPC-контракт из `@bt/shared` типизирует и клиент, и сервер, включая ошибки авторизации.
- Без запущенного бэкенда web работает на in-process моке (`VITE_USE_MOCKS=1`) с фиксированной демо-сессией.

```
apps/web        SPA на Feature-Sliced Design (см. ниже)
apps/api        Fastify: oRPC-роутер, better-auth, Drizzle-миграции и сид
packages/shared zod-контракты и типы, общие для web и api
packages/config общие конфиги eslint/typescript/prettier
e2e             Playwright-сценарии на прод-сборках
docs/adr        архитектурные решения (ADR)
```

### Структура frontend: Feature-Sliced Design

`apps/web` построен по FSD v2; связи и структура проверяются линтером steiger — `pnpm fsd:check` (входит в CI-quality):

| Слой        | Содержимое                                                                           |
| ----------- | ------------------------------------------------------------------------------------ |
| `app/`      | composition root: `main.tsx`, провайдеры, observability, `routes/` (TanStack Router) |
| `widgets/`  | каркасы страниц: `layout` (header/footer/shell)                                      |
| `features/` | пользовательские действия: `auth`, `todo-add`, `todo-filter`                         |
| `entities/` | доменные объекты: `todo` (типы, Query-хуки, `TodoItem`)                              |
| `pages/`    | страницы: todo / login / register                                                    |
| `shared/`   | фундамент: `api` (oRPC-клиент), `lib`, `ui/assets` (картинки), `styles`              |

Правила, которые соблюдает код и следит за этим steiger:

- импорт направлен только вниз по слоям (`app` → … → `shared`);
- слайсы одного слоя не импортируют друг друга (cross-imports запрещены);
- слайс импортируется только через public API — `index.ts` этого слайса;
- слои в путях видны через алиас `@/*` (→ `apps/web/src/*`), относительные импорты — только внутри слайса;
- серверное состояние (Query) живёт в `entities/*/model`, клиентское (Effector) — в `features/*/model` — [ADR-002](./docs/adr/0002-state-management.md);
- dev/test-инфраструктура (`mocks/`, `tests/`) лежит вне `src` и не является кодом продукта.

Исключения из правил — только точечные и мотивированные, зафиксированы в `apps/web/steiger.config.ts`.

## Быстрый старт

Требуется Node.js 24 (`nvm use`) и Docker.

```bash
pnpm install
pnpm start            # сам создаст .env, поднимет postgres, применит миграции и сид
                      # web http://localhost:5173, api http://localhost:3001
```

Ручной запуск по шагам:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:up                                # postgres:17 на 5433
pnpm --filter @bt/api db:migrate
pnpm --filter @bt/api db:seed
pnpm dev
```

В `apps/web/.env` можно оставить `VITE_USE_MOCKS=1` — тогда web работает совсем без бэкенда и БД (демо-сессия включается автоматически). Для полноценной работы с api выставьте `VITE_USE_MOCKS=0`.

Демо-аккаунты (сид): `demo@local.test` / `demo-pass-123` и тестовый `test_user@local.test` / `1234`.

## Проверки

| Команда          | Что делает                                                   |
| ---------------- | ------------------------------------------------------------ |
| `pnpm lint`      | ESLint по всем пакетам                                       |
| `pnpm fsd:check` | steiger: структура и импорты FSD в `apps/web`                |
| `pnpm typecheck` | tsc по всем пакетам                                          |
| `pnpm test`      | Vitest: web (RTL) и api (PGlite)                             |
| `pnpm build`     | прод-сборки web и api                                        |
| `pnpm test:e2e`  | Playwright на прод-сборках; нужен Docker и `pnpm build`      |
| `pnpm mutation`  | Stryker: мутационное тестирование `shared` и `api` (не в CI) |

CI (`quality` + `e2e`) прогоняет это на каждом PR; обе проверки обязательны для merge в `main`.

Мутационный прогон (`@stryker-mutator/vitest-runner`) добавлен отдельным ночным workflow
`.github/workflows/mutation.yml`: пороги выставлены без `break`, поэтому он только публикует артефакт-отчет.
Тесты в мутабельных пакетах (`packages/shared`, `apps/api`) не оборачивают в `describe`: per-test фильтр
Stryker с vitest 5 такие тесты не находит, и мутанты остаются живыми.

## Переменные окружения

`apps/api` (см. `apps/api/.env.example`): `DATABASE_URL`, `HOST`, `PORT`, `CORS_ORIGIN`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` (обязателен в production), `SENTRY_DSN` (опционально).

`apps/web` (см. `apps/web/.env.example`): `VITE_API_URL`, `VITE_AUTH_URL`, `VITE_USE_MOCKS`, `VITE_SENTRY_DSN` (опционально).

## Деплой

- **Web → Vercel**: Root Directory — `apps/web` (конфиг `apps/web/vercel.json` включает SPA-ревайры). Envs: `VITE_API_URL=https://<api-host>/rpc`, `VITE_AUTH_URL=https://<api-host>/api/auth`.
- **API → Railway**: Docker-сборка из корня репозитория (Dockerfile `apps/api/Dockerfile`, Railpack/Dockerfile-сервис). Envs: `NODE_ENV=production`, `HOST=0.0.0.0`, `DATABASE_URL` (Neon, pooled), `BETTER_AUTH_URL=https://<api-host>`, `BETTER_AUTH_SECRET`, `CORS_ORIGIN=https://<web-host>`. Healthcheck: `GET /health`, Dockerfile указан в `railway.json`.
- **БД → Neon**: pooled-строку — приложению, direct — для миграций: `DATABASE_URL=<direct> pnpm --filter @bt/api db:migrate`.
- **Sentry** (по желанию): `SENTRY_DSN` / `VITE_SENTRY_DSN`; без переменных Sentry не загружается.

Demo: будет добавлено после деплоя.

## Документация

- [ADR](./docs/adr) — почему стек и границы именно такие: monorepo, состояние, oRPC-контракт, auth, стратегия E2E.
- Шаблоны PR/issue и правила коммитов (commitlint) — в `.github/` и `commitlint.config.js`.
