import type { TodoFilter } from '@/entities/todo';
import { checkIcon, clearAllIcon, doneIcon } from '@/shared/ui/assets';
import { cn } from '@/shared/lib';

interface TodoFilterProps {
  filter: TodoFilter;
  search: string;
  onFilterChange: (filter: TodoFilter) => void;
  onSearchChange: (search: string) => void;
}

const options: Array<{ value: TodoFilter; label: string; icon: string }> = [
  { value: 'all', label: 'All', icon: clearAllIcon },
  { value: 'active', label: 'Active', icon: checkIcon },
  { value: 'done', label: 'Done', icon: doneIcon },
];

/** Поиск и сегментированный переключатель статуса; значения приходят из URL, изменения отдаются наверх */
export function TodoFilterBar({ filter, search, onFilterChange, onSearchChange }: TodoFilterProps) {
  return (
    <form
      role="search"
      className="flex flex-wrap items-center gap-2 rounded-md bg-card-strong p-2 ring-1 ring-ring-soft sm:gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="sr-only" htmlFor="todo-search">
        Search todos
      </label>
      <input
        id="todo-search"
        type="search"
        className={cn(
          'focus-ring min-w-40 flex-1 rounded-md border-b-2 border-accent-soft bg-card px-3 py-1.5',
          'text-xl text-white placeholder:text-gray-400 focus:outline-none',
        )}
        placeholder="Search Todos"
        autoComplete="off"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div role="group" aria-label="Status filter" className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            aria-controls="todo-list"
            className={cn(
              'focus-ring flex items-center gap-1.5 rounded px-2.5 py-1 text-lg',
              'ring-1 ring-ring-soft transition-colors hover:bg-ring-soft',
              filter === option.value && 'bg-ring-soft ring-white',
            )}
            onClick={() => onFilterChange(option.value)}
          >
            <img src={option.icon} alt="" className="size-5" />
            {option.label}
          </button>
        ))}
      </div>
    </form>
  );
}
