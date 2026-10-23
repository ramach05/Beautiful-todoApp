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

/** Поиск и сегментированный переключатель статуса; управляемый компонент, состояние владелет страница */
export function TodoFilterBar({ filter, search, onFilterChange, onSearchChange }: TodoFilterProps) {
  return (
    <form
      className="flex flex-wrap items-center gap-3 rounded-md bg-card-strong p-2 ring-1 ring-ring-soft"
      onSubmit={(event) => event.preventDefault()}
    >
      <input
        type="search"
        className={cn(
          'min-w-40 flex-1 rounded-md border-b-2 border-accent-soft bg-card px-3 py-1.5',
          'text-xl text-white placeholder:text-gray-400 focus:outline-none',
        )}
        placeholder="Search Todos"
        autoComplete="off"
        aria-label="Search todos"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div role="group" aria-label="Status filter" className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-lg',
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
