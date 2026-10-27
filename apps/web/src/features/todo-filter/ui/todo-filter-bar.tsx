import { useTranslation } from 'react-i18next';

import type { TodoFilter } from '@/entities/todo';
import { checkIcon, clearAllIcon, doneIcon } from '@/shared/ui/assets';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';

interface TodoFilterProps {
  filter: TodoFilter;
  search: string;
  onFilterChange: (filter: TodoFilter) => void;
  onSearchChange: (search: string) => void;
}

const options: Array<{ value: TodoFilter; icon: string }> = [
  { value: 'all', icon: clearAllIcon },
  { value: 'active', icon: checkIcon },
  { value: 'done', icon: doneIcon },
];

/** Поиск и сегментированный переключатель статуса; значения приходят из URL, изменения отдаются наверх */
export function TodoFilterBar({ filter, search, onFilterChange, onSearchChange }: TodoFilterProps) {
  const { t } = useTranslation();
  return (
    <form
      role="search"
      className="flex flex-wrap items-center gap-2 rounded-md bg-card-strong p-2 ring-1 ring-ring-soft sm:gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="sr-only" htmlFor="todo-search">
        {t('todos.search_label')}
      </label>
      <TextField
        id="todo-search"
        type="search"
        variant="search"
        className="min-w-40 flex-1"
        placeholder={t('todos.search_placeholder')}
        autoComplete="off"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div role="group" aria-label={t('todos.filter_aria')} className="flex flex-wrap gap-1">
        {options.map((option) => (
          <Button
            key={option.value}
            variant="chip"
            aria-pressed={filter === option.value}
            aria-controls="todo-list"
            onClick={() => onFilterChange(option.value)}
          >
            <img src={option.icon} alt="" className="size-5" />
            {t(`todos.filters.${option.value}`)}
          </Button>
        ))}
      </div>
    </form>
  );
}
