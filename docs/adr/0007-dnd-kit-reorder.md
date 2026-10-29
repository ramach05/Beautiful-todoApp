# 0007. Drag-and-drop todo order: @dnd-kit + a position column

🇬🇧 **English** | [🇷🇺 Русский](0007-dnd-kit-reorder.ru.md)

Date: 2026-10-28. Status: accepted.

## Context

The todo list sorted only by `created_at`. The user needs a manual order: moving a row in the
list with the mouse and with the keyboard, the order must survive reloads and stay isolated per
owner. Order is server data: a client-side shadow store would contradict ADR-0002, and
hand-rolled dragging on HTML5 DnD (dataTransfer, flicker, no keyboard or auto-scroll) costs
more custom glue than a ready library.

## Decision

- **Library — @dnd-kit (core + sortable + modifiers + utilities).** MIT, no styles of its own
  (the layout is dictated by the project's Tailwind code), mouse/touch/keyboard sensors out of
  the box, screen-reader announcements via a translatable `Announcements`. Alternatives: HTML5
  DnD — no keyboard and flaky cross-browser behavior; pragmatic-drag-and-drop — newer but with
  noticeably fewer React-sorting examples; react-beautiful-dnd — archived at the time of
  choosing.
- **The order is stored by the `position` column (integer, default 0).** `list` sorts by
  `position → created_at → id`: older rows with equal position keep their familiar creation
  order, `create` gives a new todo `max+1` per owner — it lands last even after manual moves.
  Fractional indexing (lexo-rank) was rejected: single moves of the whole list in one request
  create no concurrent merges, and a full `reorder` by id is simpler and easier to verify.
- **Contract — the `todos.reorder({ ids })` procedure** (ADR-0003): the full id list in the new
  order, the output — a validated `todoListSchema`. The repository scopes the move to the
  owner: a foreign id changes nothing.
- **UI — the `features/todo-reorder` slice:** `TodoDndContext` (DndContext + SortableContext,
  the vertical modifier, translated instructions and SR announcements) and `SortableTodoItem`
  (`useSortable`, transform/transition; on `prefers-reduced-motion` the transition is zeroed).
  `entities/todo/ui/TodoItem` knows nothing about dnd-kit: it receives the row ref/styles and a
  ready-made handle — the entity does not depend on the library.
- **The `useReorderTodos` mutation is optimistic like the rest of the CRUD** (ADR-0002): the
  Query cache is reordered by `ids` before the response, `onError` rolls back, `onSettled`
  invalidates. The move is computed over the full list (`reorderTodos` from `@bt/shared`), so
  dragging inside a filtered view moves the todo to the right place.

## Consequences

- Order is part of server state: the behavior "the order survives a reload" is linkable, e2e
  checks it with real mouse events and it survives `page.reload()`.
- The keyboard path (Space — pick up, arrow keys — move) and the screen-reader announcements are
  translated through the `todos.drag.*` dictionaries — the fsd check and the axe a11y run cover
  the new controls.
- Cost: four dependency packages, a position column with a migration, and a mandatory full id
  array in `reorder` (immaterial for todo-app list sizes).
