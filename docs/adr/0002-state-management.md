# 0002. State split: TanStack Query / Effector / TanStack Router

🇬🇧 **English** | [🇷🇺 Русский](0002-state-management.ru.md)

Date: 2026-10-22. Amended: 2026-10-23. Status: accepted.

## Context

The app has three heterogeneous kinds of state: server data (the todo list), client-side UI
status (the active filter, the session) and the URL. One global store for everything turns
into boilerplate and manual cache invalidation; an "all in Query" approach fits poorly for
purely client-side values, "all in Effector" fits poorly for server synchronization.

## Decision

- Server state — TanStack Query: caching, background refetches and optimistic CRUD mutations
  of todos with rollback on error.
- State that wants to be a link — TanStack Router: the status filter and the search string of
  the todo page live in the search params of `/` (`?filter=active&q=text`). The field schema
  and its parsing — `features/todo-filter/model/search.ts`, wired into the route through
  `validateSearch`; every field uses `z.catch`, so junk in the address collapses to the
  default value instead of crashing the page.
- Client state without link value — Effector: the session (`sessionReady`, `signIn/signUp/signOut`,
  `$session`) and account commands. Default values (`filter=all`, empty search) are not written
  into the URL so links stay clean; search updates go with `replace: true` and do not pollute
  the history.
- Routing — TanStack Router (file-based) with a guard: without a session an anonymous user is
  sent to `/login`, a signed-in user does not come back to the auth forms.

## Consequences

- Each kind of state lives in its own model, boundaries are visible in the `features/*/model`
  structure: filter stores were removed, the `todo-filter` feature owns the param schema and its UI.
- Filter and search survive a reload, are shareable as links and work with the back button
  (the filter goes into the history, typing in search does not). A store for filters was not
  worth this cost: it would have to be serialized into the URL by hand.
- Query keys are typed by the contract; the filter is an external display argument, not a derived store.
- Cost: three state tools instead of two; the "what lives where" rules are held by discipline
  (code review).
