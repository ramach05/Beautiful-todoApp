# 0003. End-to-end type-safe RPC contract on oRPC instead of REST + OpenAPI

🇬🇧 **English** | [🇷🇺 Русский](0003-orpc-contract.ru.md)

Date: 2026-10-22. Status: accepted.

## Context

Client and server must share one contract: methods, bodies, responses, errors. Classic
REST + OpenAPI requires codegen and a separate spec build; hand-written fetch wrappers drift
apart silently.

## Decision

`@bt/shared` describes the contract with `@orpc/contract` + zod: the `todos.list/create/update/remove`
procedures and the authorized-procedure schema. `apps/api` implements the contract on
`@orpc/server` (a Fastify handler at `/rpc`), `apps/web` calls it through the typed
`@orpc/client`. The zod schema is the single place shapes are described: runtime validation on
the server, a static type on the client. Errors are typed in the contract: `UNAUTHORIZED` from
the session middleware is recognized by the client without string comparisons.

## Consequences

- Changing the contract breaks the client and the server builds — a mismatch cannot slip through.
- The same contract feeds the in-process mock (`VITE_USE_MOCKS=1`): mock and prod differ only
  in the transport and the session resolver.
- Cost: RPC urls are slash paths (`POST /rpc/todos/list`), no eyeball-friendly GET/PUT; oRPC is
  a young tool, its updates need attention.
