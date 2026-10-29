# ADR

🇬🇧 **English** | [🇷🇺 Русский](README.ru.md)

Short records of accepted architecture decisions: context, decision, consequences.
Numbering is sequential; accepted ADRs are not rewritten — a revision adds a new
record that links back.

| #                                     | Decision                                                            | Status   |
| ------------------------------------- | ------------------------------------------------------------------- | -------- |
| [0001](0001-monorepo.md)              | Monorepo on pnpm workspaces + Turborepo                             | Accepted |
| [0002](0002-state-management.md)      | State split: TanStack Query / Effector / TanStack Router            | Accepted |
| [0003](0003-orpc-contract.md)         | End-to-end typed RPC contract on oRPC instead of REST + OpenAPI     | Accepted |
| [0004](0004-auth-better-auth.md)      | Auth on better-auth, data isolated per owner                        | Accepted |
| [0005](0005-e2e-production-builds.md) | E2E on production builds with a dedicated database                  | Accepted |
| [0006](0006-i18n-react-i18next.md)    | i18n on react-i18next, user language on the better-auth user record | Accepted |
| [0007](0007-dnd-kit-reorder.md)       | Drag-and-drop todo order: @dnd-kit + a position column              | Accepted |
