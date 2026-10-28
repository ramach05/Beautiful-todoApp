import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Over,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

import { type Todo, TodoItem } from '@/entities/todo';
import { dragIcon } from '@/shared/ui/assets';
import { Button } from '@/shared/ui/button';

/** Put on body for the duration of a drag: hover states are disabled through it */
const DRAGGING_CLASS = 'todo-dragging';

/** The class is needed before the first re-render: otherwise the hover lift starts on the first drag pixels */
function setDragging(on: boolean) {
  document.body.classList.toggle(DRAGGING_CLASS, on);
}

const noop = () => undefined;

/** Static row clone in the overlay: no listeners, the library ignores the pointer over it */
function DragOverlayRow({ todo, query }: { todo: Todo; query?: string }) {
  const { t } = useTranslation();
  const handleLabel = t('todos.drag.handle', { title: todo.title });
  return (
    <TodoItem
      todo={todo}
      query={query}
      onToggleDone={noop}
      onToggleImportant={noop}
      onDelete={noop}
      drag={{
        nodeRef: noop,
        style: {},
        active: true,
        handle: (
          <Button
            variant="icon"
            className="tip drag-handle"
            aria-label={handleLabel}
            data-tip={handleLabel}
            tabIndex={-1}
          >
            <img src={dragIcon} alt="" aria-hidden className="size-5" />
          </Button>
        ),
      }}
    />
  );
}

interface TodoDndContextProps {
  /** ids of visible rows in current order: sortable computes the permutation from them */
  ids: string[];
  /** Visible todos: activeTodo builds the row clone in DragOverlay */
  todos: Todo[];
  /** Search string: the clone highlight matches the row in the list */
  query?: string;
  onReorder: (draggedId: string, overId: string) => void;
  children: ReactNode;
}

/** dnd-kit returns data untyped: extract the todo title passed into useSortable */
function titleOf(data: Active['data'] | Over['data']): string {
  const current: unknown = data.current;
  if (typeof current === 'object' && current !== null && 'title' in current) {
    const { title } = current as { title: unknown };
    return typeof title === 'string' ? title : '';
  }
  return '';
}

/**
 * Todo list DnD context: mouse and keyboard, vertical-only dragging,
 * screen readers get translated announcements.
 */
export function TodoDndContext({ ids, todos, query, onReorder, children }: TodoDndContextProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTodo = activeId === null ? undefined : todos.find((todo) => todo.id === activeId);
  const sensors = useSensors(
    // 4px distance tells a click on the activator button apart from the start of a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Fixed reference: screen reader settings must not be recreated on every pointermove
  const accessibility = useMemo(
    () => ({
      screenReaderInstructions: { draggable: t('todos.drag.instructions') },
      announcements: {
        onDragStart: ({ active }: { active: Active }) =>
          t('todos.drag.started', { title: titleOf(active.data) }),
        onDragOver: ({ active, over }: { active: Active; over: Over | null }) =>
          over
            ? t('todos.drag.over', { title: titleOf(active.data), over: titleOf(over.data) })
            : '',
        onDragEnd: ({ active, over }: { active: Active; over: Over | null }) =>
          over
            ? t('todos.drag.ended', { title: titleOf(active.data), over: titleOf(over.data) })
            : t('todos.drag.cancelled', { title: titleOf(active.data) }),
        onDragCancel: ({ active }: { active: Active }) =>
          t('todos.drag.cancelled', { title: titleOf(active.data) }),
      } satisfies Announcements,
    }),
    [t],
  );

  // The class is removed both in onDragEnd/onDragCancel and here: in case of unmounting mid-drag
  useEffect(() => () => setDragging(false), []);

  function handleDragStart({ active }: DragStartEvent) {
    setDragging(true);
    setActiveId(String(active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(false);
    setActiveId(null);
    if (over && String(active.id) !== String(over.id)) {
      onReorder(String(active.id), String(over.id));
    }
  }

  function handleDragCancel() {
    setDragging(false);
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={accessibility}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      {/* The dragged row is a clone in a fixed overlay: the original stands hidden in place,
          so the list does not stretch the scroll and autoscroll computes zones from the clone.
          dropAnimation={null}: the clone has nowhere to fly back to — the row at release
          is already at its new place, while the default animation would pull the clone to the old slot */}
      <DragOverlay
        className="todo-drag-overlay"
        modifiers={[restrictToVerticalAxis]}
        dropAnimation={null}
      >
        {activeTodo ? <DragOverlayRow todo={activeTodo} query={query} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
