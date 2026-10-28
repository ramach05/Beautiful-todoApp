import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

import type { TodoFilter } from '@/entities/todo';
import { checkIcon, clearAllIcon, closeIcon, doneIcon } from '@/shared/ui/assets';
import { cn } from '@/shared/lib';
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

/** Search and segmented status switch; values come from the URL, changes are passed up */
export function TodoFilterBar({ filter, search, onFilterChange, onSearchChange }: TodoFilterProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const clearLabel = t('todos.search_clear');
  return (
    <form
      role="search"
      className="flex flex-wrap items-center gap-2 rounded-md bg-card-strong p-2 ring-1 ring-ring-soft sm:gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="sr-only" htmlFor="todo-search">
        {t('todos.search_label')}
      </label>
      <div className="relative min-w-40 flex-1">
        <TextField
          ref={inputRef}
          id="todo-search"
          type="search"
          variant="search"
          className={cn('w-full', search !== '' && 'pr-10')}
          placeholder={t('todos.search_placeholder')}
          autoComplete="off"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search !== '' && (
          <Button
            variant="icon"
            className="icon-btn-clear tip absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={clearLabel}
            data-tip={clearLabel}
            onClick={() => {
              onSearchChange('');
              inputRef.current?.focus();
            }}
          >
            <img src={closeIcon} alt="" aria-hidden className="size-5" />
          </Button>
        )}
      </div>

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
