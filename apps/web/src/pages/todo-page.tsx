import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import type { Todo } from '@bt/shared';

import { TodoAdd } from '../features/todo-add/ui';
import { TodoFilterBar } from '../features/todo-filter/ui';
import {
  $todoFilter,
  $todoSearch,
  filterChanged,
  searchChanged,
} from '../features/todo-filter/model/filters';
import { useDeleteTodo, useTodos, useUpdateTodo } from '../features/todo/model/queries';
import { TodoItem } from '../entities/todo/ui/todo-item';
import { filterTodos } from '../entities/todo/model';

/**
 * Страница todo: серверные задачи из Query, фильтры из Effector.
 * Позиционирование business-логики: ADR-002.
 */
export function TodoPage() {
  const filter = useUnit($todoFilter);
  const search = useUnit($todoSearch);
  const todosQuery = useTodos();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const todos = useMemo(
    () => filterTodos(todosQuery.data ?? [], filter, search),
    [todosQuery.data, filter, search],
  );
  const remaining = useMemo(
    () => (todosQuery.data ?? []).filter((todo) => !todo.done).length,
    [todosQuery.data],
  );

  function toggleDone(todo: Todo) {
    updateTodo.mutate({ id: todo.id, patch: { done: !todo.done } });
  }

  function toggleImportant(todo: Todo) {
    if (todo.done) return;
    updateTodo.mutate({ id: todo.id, patch: { important: !todo.important } });
  }

  if (todosQuery.isPending) {
    return <p className="py-10 text-center text-xl text-gray-300">Loading…</p>;
  }

  if (todosQuery.isError) {
    return (
      <div className="py-10 text-center" role="alert">
        <p className="text-xl text-accent">Failed to load todos</p>
        <button
          type="button"
          className="mt-3 rounded bg-card-strong px-4 py-2 ring-1 ring-ring-soft hover:bg-ring-soft"
          onClick={() => void todosQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TodoFilterBar
        filter={filter}
        search={search}
        onFilterChange={filterChanged}
        onSearchChange={searchChanged}
      />

      <p className="text-lg text-gray-300" aria-live="polite">
        {remaining} more to do, {(todosQuery.data?.length ?? 0) - remaining} done
      </p>

      <ul className="flex flex-col gap-2" aria-label="Todo list">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggleDone={toggleDone}
            onToggleImportant={toggleImportant}
            onDelete={(id) => deleteTodo.mutate(id)}
          />
        ))}
        {todos.length === 0 && (
          <li className="rounded-[10px] bg-card px-3 py-6 text-center text-xl text-gray-300">
            No todos — add your first one
          </li>
        )}
      </ul>

      <TodoAdd />
    </div>
  );
}
