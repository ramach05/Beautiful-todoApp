import type { Todo } from '@bt/shared';
import { useTranslation } from 'react-i18next';
import type { CSSProperties, ReactNode } from 'react';

import { deleteIcon, importantActiveIcon, importantIcon } from '@/shared/ui/assets';
import { HighlightText } from '@/shared/ui/highlight-text';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/button';

/** Passed down from the dnd context: the library attaches ref/transform to the row, activators to the handle */
interface TodoDragProps {
  nodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  /** Style the row as dragged (shadow above neighbors): set only on the clone in DragOverlay */
  active?: boolean;
  /** Drag activator button with listeners */
  handle: ReactNode;
}

interface TodoItemProps {
  todo: Todo;
  /** Search string: matches in the title are highlighted in bold */
  query?: string;
  onToggleDone: (todo: Todo) => void;
  onToggleImportant: (todo: Todo) => void;
  onDelete: (id: string) => void;
  /** entrance-animation delay in ms; passed only on the initial list mount */
  entranceDelay?: number;
  drag?: TodoDragProps;
}

/**
 * List row: the title is a button whose pseudo-element covers the whole row,
 * so a mouse click on the row toggles done, while keyboard access goes through the button.
 * The important button is active only for unfinished todos.
 */
export function TodoItem({
  todo,
  query,
  onToggleDone,
  onToggleImportant,
  onDelete,
  entranceDelay,
  drag,
}: TodoItemProps) {
  const { t } = useTranslation();
  const importantLabel = t(
    todo.important ? 'todos.item.unmark_important' : 'todos.item.mark_important',
  );

  return (
    <li
      ref={drag?.nodeRef}
      className={cn(
        'lift relative flex items-center justify-between gap-3 rounded-[10px] bg-card-strong px-3 py-2',
        'ring-1 ring-ring-soft hover:bg-ring-soft hover:ring-white',
        drag?.active && 'row-dragging',
      )}
      style={{
        ...(entranceDelay !== undefined ? { animationDelay: `${entranceDelay}ms` } : undefined),
        ...drag?.style,
      }}
    >
      {drag && (
        <div className="row-handle relative z-10 flex shrink-0 items-center">{drag.handle}</div>
      )}

      <button
        type="button"
        className={cn(
          'row-toggle todo-title min-w-0 flex-1 break-words rounded-[10px] text-left text-2xl leading-snug',
          todo.done && 'text-gray-400',
          todo.important && !todo.done && 'text-accent-soft',
        )}
        data-done={todo.done}
        aria-pressed={todo.done}
        onClick={() => onToggleDone(todo)}
      >
        {/* inline wrapper: the background breaks per line, a strike on each line of text */}
        <span className="todo-strike">
          <HighlightText text={todo.title} query={query ?? ''} />
        </span>
      </button>

      {/* Layer above the row overlay, otherwise its pseudo-element would intercept action clicks */}
      <div className="row-actions relative z-10 flex shrink-0 items-center gap-1">
        <Button
          variant="icon"
          className="tip"
          data-tip={importantLabel}
          aria-label={importantLabel}
          disabled={todo.done}
          onClick={(event) => {
            event.stopPropagation();
            onToggleImportant(todo);
          }}
        >
          <img
            src={todo.important ? importantActiveIcon : importantIcon}
            alt=""
            aria-hidden
            className="size-6"
          />
        </Button>
        <Button
          variant="icon"
          className="icon-btn-danger tip"
          data-tip={t('todos.item.delete_title')}
          aria-label={t('todos.item.delete_aria')}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(todo.id);
          }}
        >
          <img src={deleteIcon} alt="" aria-hidden className="size-6" />
        </Button>
      </div>
    </li>
  );
}
