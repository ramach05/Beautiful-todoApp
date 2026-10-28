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
 * Todo row wired into the sortable context: row transform/transition
 * and drag listeners on the handle button are passed into TodoItem.
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
        // the dragged row is hidden in its place: the clone flies in DragOverlay,
        // transform is not applied — it would stretch the document scroll
        style: isDragging
          ? { opacity: 0 }
          : {
              // on prefers-reduced-motion the transition is zeroed: rows move without animation
              transform: CSS.Translate.toString(transform),
              transition: prefersReducedMotion() ? undefined : transition,
            },
        handle,
      }}
    />
  );
}
