import type { Todo } from '@bt/shared';
import { useTranslation } from 'react-i18next';

import { deleteIcon, importantActiveIcon, importantIcon } from '@/shared/ui/assets';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/button';

interface TodoItemProps {
  todo: Todo;
  onToggleDone: (todo: Todo) => void;
  onToggleImportant: (todo: Todo) => void;
  onDelete: (id: string) => void;
  /** Задержка entrance-анимации в мс; передается только на первичном монтировании списка */
  entranceDelay?: number;
}

/**
 * Строка списка: заголовок — кнопка, псевдоэлемент которой перекрывает всю строку,
 * поэтому клик мышью по строке переключает done, а доступ с клавиатуры идет через кнопку.
 * Кнопка important активна только для незавершенных задач.
 */
export function TodoItem({
  todo,
  onToggleDone,
  onToggleImportant,
  onDelete,
  entranceDelay,
}: TodoItemProps) {
  const { t } = useTranslation();
  const importantLabel = t(
    todo.important ? 'todos.item.unmark_important' : 'todos.item.mark_important',
  );

  return (
    <li
      className={cn(
        'lift relative flex items-center justify-between gap-3 rounded-[10px] bg-card-strong px-3 py-2',
        'ring-1 ring-ring-soft hover:bg-ring-soft hover:ring-white',
      )}
      style={entranceDelay !== undefined ? { animationDelay: `${entranceDelay}ms` } : undefined}
    >
      <button
        type="button"
        className={cn(
          'row-toggle todo-title min-w-0 break-words rounded-[10px] text-left text-2xl leading-snug',
          todo.done && 'text-gray-400',
          todo.important && !todo.done && 'text-accent-soft',
        )}
        data-done={todo.done}
        aria-pressed={todo.done}
        onClick={() => onToggleDone(todo)}
      >
        {todo.title}
      </button>

      {/* Слой выше перекрытия строки, иначе его псевдоэлемент перехватывал бы клики действий */}
      <div className="row-actions relative z-10 flex shrink-0 items-center gap-1">
        <Button
          variant="icon"
          title={importantLabel}
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
          className="icon-btn-danger"
          title={t('todos.item.delete_title')}
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
