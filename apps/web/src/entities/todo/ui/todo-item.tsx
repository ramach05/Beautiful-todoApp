import importantActiveIcon from '../../../assets/images/svg/warning-active_amber_orange_24dp.svg';
import importantIcon from '../../../assets/images/svg/warning_amber_white_24dp.svg';
import trashIcon from '../../../assets/images/svg/delete_forever_white_24dp.svg';
import type { Todo } from '@bt/shared';
import { cn } from '../../../shared/ui/cn';

interface TodoItemProps {
  todo: Todo;
  onToggleDone: (todo: Todo) => void;
  onToggleImportant: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

/** Строка списка: клик по строке переключает done, кнопка important активна только для незавершенных */
export function TodoItem({ todo, onToggleDone, onToggleImportant, onDelete }: TodoItemProps) {
  return (
    <li
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-[10px] bg-card-strong px-3 py-2',
        'ring-1 ring-ring-soft transition-colors duration-500 hover:bg-ring-soft hover:ring-white',
      )}
      onClick={() => onToggleDone(todo)}
    >
      <p
        className={cn(
          'text-2xl leading-snug',
          todo.done && 'text-gray-400 line-through',
          todo.important && !todo.done && 'text-accent-soft',
        )}
      >
        {todo.title}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="rounded p-1 hover:bg-ring-soft disabled:opacity-40"
          title="Mark as important"
          disabled={todo.done}
          onClick={(event) => {
            event.stopPropagation();
            onToggleImportant(todo);
          }}
        >
          <img
            src={todo.important ? importantActiveIcon : importantIcon}
            alt="Mark as important"
            className="size-6"
          />
        </button>
        <button
          type="button"
          className="rounded p-1 hover:bg-ring-soft"
          title="Delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(todo.id);
          }}
        >
          <img src={trashIcon} alt="Delete todo" className="size-6" />
        </button>
      </div>
    </li>
  );
}
