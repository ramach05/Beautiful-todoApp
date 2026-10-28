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

/** Вешается на body на время перетаскивания: по нему отключаются hover-состояния */
const DRAGGING_CLASS = 'todo-dragging';

/** Класс нужен до первого ре-рендера: иначе hover-подъем успевает начаться на первых пикселях драга */
function setDragging(on: boolean) {
  document.body.classList.toggle(DRAGGING_CLASS, on);
}

const noop = () => undefined;

/** Статичный клон строки в оверлее: слушателей нет, библиотекой указатель поверх него игнорируется */
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
  /** id видимых строк в текущем порядке: по ним sortable считает перестановку */
  ids: string[];
  /** Видимые задачи: по activeTodo строится клон строки в DragOverlay */
  todos: Todo[];
  /** Строка поиска: подсветка клона совпадает со строкой в списке */
  query?: string;
  onReorder: (draggedId: string, overId: string) => void;
  children: ReactNode;
}

/** dnd-kit отдает data нетипизированным: достаем заголовок задачи, переданный в useSortable */
function titleOf(data: Active['data'] | Over['data']): string {
  const current: unknown = data.current;
  if (typeof current === 'object' && current !== null && 'title' in current) {
    const { title } = current as { title: unknown };
    return typeof title === 'string' ? title : '';
  }
  return '';
}

/**
 * DnD-контекст списка задач: мышь и клавиатура, перетаскивание только по вертикали,
 * экранные дикторы получают переведенные объявления.
 */
export function TodoDndContext({ ids, todos, query, onReorder, children }: TodoDndContextProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTodo = activeId === null ? undefined : todos.find((todo) => todo.id === activeId);
  const sensors = useSensors(
    // дистанция 4px отличает клик по кнопке-активатору от начала перетаскивания
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Фиксированная ссылка: настройки диктора не должны пересоздаваться на каждый pointermove
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

  // Класс снимается и в onDragEnd/onDragCancel, и здесь: на случай размонтирования посреди драга
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
      {/* Ведомая строка — клон в fixed-оверлее: исходная стоит на месте скрытой,
          поэтому список не растягивает прокрутку и автоскролл считает зоны по клону.
          dropAnimation={null}: долетать клон некуда — строка в момент отпускания
          уже на новом месте, а анимация по умолчанию утаскивает клон к прежнему слоту */}
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
