import type { Todo } from '@bt/shared';
import { deleteIcon, importantActiveIcon, importantIcon } from '@/shared/ui/assets';
import { cn } from '@/shared/lib';

interface TodoItemProps {
  todo: Todo;
  onToggleDone: (todo: Todo) => void;
  onToggleImportant: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

/**
 * Строка списка: заголовок — кнопка, псевдоэлемент которой перекрывает всю строку,
 * поэтому клик мышью по строке переключает done, а доступ с клавиатуры идет через кнопку.
 * Кнопка important активна только для незавершенных задач.
 */
export function TodoItem({ todo, onToggleDone, onToggleImportant, onDelete }: TodoItemProps) {
  const importantLabel = todo.important ? 'Unmark as important' : 'Mark as important';

  return (
    <li
      className={cn(
        'relative flex items-center justify-between gap-3 rounded-[10px] bg-card-strong px-3 py-2',
        'ring-1 ring-ring-soft transition-colors duration-500 hover:bg-ring-soft hover:ring-white',
      )}
    >
      <button
        type="button"
        className={cn(
          'row-toggle min-w-0 break-words rounded-[10px] text-left text-2xl leading-snug',
          todo.done && 'text-gray-400 line-through',
          todo.important && !todo.done && 'text-accent-soft',
        )}
        aria-pressed={todo.done}
        onClick={() => onToggleDone(todo)}
      >
        {todo.title}
      </button>

      {/* Слой выше перекрытия строки, иначе его псевдоэлемент перехватывал бы клики действий */}
      <div className="relative z-10 flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="focus-ring rounded p-1 hover:bg-ring-soft disabled:opacity-40"
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
        </button>
        <button
          type="button"
          className="focus-ring rounded p-1 hover:bg-ring-soft"
          title="Delete"
          aria-label="Delete todo"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(todo.id);
          }}
        >
          <img src={deleteIcon} alt="" aria-hidden className="size-6" />
        </button>
      </div>
    </li>
  );
}
