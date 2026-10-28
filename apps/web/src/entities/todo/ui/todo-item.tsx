import type { Todo } from '@bt/shared';
import { useTranslation } from 'react-i18next';
import type { CSSProperties, ReactNode } from 'react';

import { deleteIcon, importantActiveIcon, importantIcon } from '@/shared/ui/assets';
import { HighlightText } from '@/shared/ui/highlight-text';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/button';

/** Прокидывается из dnd-контекста: библиотека вешает на строку ref/transform, активатор — на handle */
interface TodoDragProps {
  nodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  /** Строку тащат прямо сейчас */
  active: boolean;
  /** Кнопка-активатор перетаскивания со слушателями */
  handle: ReactNode;
}

interface TodoItemProps {
  todo: Todo;
  /** Строка поиска: совпадения в заголовке выделяются жирным */
  query?: string;
  onToggleDone: (todo: Todo) => void;
  onToggleImportant: (todo: Todo) => void;
  onDelete: (id: string) => void;
  /** Задержка entrance-анимации в мс; передается только на первичном монтировании списка */
  entranceDelay?: number;
  drag?: TodoDragProps;
}

/**
 * Строка списка: заголовок — кнопка, псевдоэлемент которой перекрывает всю строку,
 * поэтому клик мышью по строке переключает done, а доступ с клавиатуры идет через кнопку.
 * Кнопка important активна только для незавершенных задач.
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
        <HighlightText text={todo.title} query={query ?? ''} />
      </button>

      {/* Слой выше перекрытия строки, иначе его псевдоэлемент перехватывал бы клики действий */}
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
