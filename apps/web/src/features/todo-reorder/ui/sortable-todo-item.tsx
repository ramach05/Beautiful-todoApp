import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import type { ComponentProps } from 'react';

import { TodoItem } from '@/entities/todo';
import { dragIcon } from '@/shared/ui/assets';
import { Button } from '@/shared/ui/button';
import { prefersReducedMotion } from '@/shared/lib';

type SortableTodoItemProps = Omit<ComponentProps<typeof TodoItem>, 'drag'>;

/**
 * Строка задачи, подключенная к sortable-контексту: transform/transition строки
 * и слушатели перетаскивания на кнопке-handle передаются внутрь TodoItem.
 */
export function SortableTodoItem(props: SortableTodoItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.todo.id, data: { title: props.todo.title } });

  const handleLabel = t('todos.drag.handle', { title: props.todo.title });
  const handle = (
    <Button
      variant="icon"
      className="tip drag-handle"
      aria-label={handleLabel}
      data-tip={handleLabel}
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
    >
      <img src={dragIcon} alt="" aria-hidden className="size-5" />
    </Button>
  );

  return (
    <TodoItem
      {...props}
      drag={{
        nodeRef: setNodeRef,
        // ведомая строка скрыта на своем месте: клон летает в DragOverlay,
        // transform не применяем — он растягивал бы прокрутку документа
        style: isDragging
          ? { opacity: 0 }
          : {
              // на prefers-reduced-motion transition обнуляем: строки переезжают без анимации
              transform: CSS.Translate.toString(transform),
              transition: prefersReducedMotion() ? undefined : transition,
            },
        handle,
      }}
    />
  );
}
