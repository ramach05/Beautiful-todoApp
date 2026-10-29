# 0001. Монорепо на pnpm workspaces + Turborepo

[🇬🇧 English](0001-monorepo.md) | 🇷🇺 **Русский**

Дата: 2026-10-22. Статус: принято.

## Контекст

Проект перерабатывался из CRA-приложения в fullstack: SPA, HTTP-api и общие контракты типов. Варианты размещения: отдельные репозитории, монорепо без инструментов сборки, pnpm workspaces + Turborepo.

## Решение

Один репозиторий с pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`, `packages/config`, `e2e`. Общие zod-контракты и типы вынесены в `@bt/shared`, зависимости только через `workspace:*`. Кэш и инкрементальность сборки/проверок даёт Turborepo (`build`/`typecheck`/`lint`/`test`), у `typecheck` зависимость `dependsOn: ["^build"]` — типы пакетов-зависимостей берутся из их `dist`.

## Последствия

- Типы контрактов существуют в единственном месте; рассинхрон клиента и сервера становится ошибкой компиляции.
- Общие конфиги (eslint/typescript/prettier) публикуются как `@bt/config` и не дублируются.
- Цена: связанный цикл релизов и обязательный `build` перед `typecheck`; Node/pnpm версии фиксированы (`engines`, `packageManager`, nvm).
