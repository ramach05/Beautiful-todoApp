import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type Over,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

interface TodoDndContextProps {
  /** id видимых строк в текущем порядке: по ним sortable считает перестановку */
  ids: string[];
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
export function TodoDndContext({ ids, onReorder, children }: TodoDndContextProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    // дистанция 4px отличает клик по кнопке-активатору от начала перетаскивания
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const announcements: Announcements = {
    onDragStart: ({ active }) => t('todos.drag.started', { title: titleOf(active.data) }),
    onDragOver: ({ active, over }) =>
      over ? t('todos.drag.over', { title: titleOf(active.data), over: titleOf(over.data) }) : '',
    onDragEnd: ({ active, over }) =>
      over
        ? t('todos.drag.ended', { title: titleOf(active.data), over: titleOf(over.data) })
        : t('todos.drag.cancelled', { title: titleOf(active.data) }),
    onDragCancel: ({ active }) => t('todos.drag.cancelled', { title: titleOf(active.data) }),
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && String(active.id) !== String(over.id)) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{
        screenReaderInstructions: { draggable: t('todos.drag.instructions') },
        announcements,
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
