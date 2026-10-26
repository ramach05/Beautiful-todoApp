import { useNavigate, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

import { TodoAdd } from '@/features/todo-add';
import { buildTodoSearch, TodoFilterBar } from '@/features/todo-filter';
import {
  type Todo,
  type TodoFilter,
  filterTodos,
  TodoItem,
  useDeleteTodo,
  useTodos,
  useUpdateTodo,
} from '@/entities/todo';

/**
 * Страница todo: серверные задачи из Query, фильтр и поиск из URL (ADR-002).
 */
export function TodoPage() {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const todosQuery = useTodos();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const filter: TodoFilter = search.filter ?? 'all';
  const query = search.q ?? '';

  const todos = useMemo(
    () => filterTodos(todosQuery.data ?? [], filter, query),
    [todosQuery.data, filter, query],
  );
  const remaining = useMemo(
    () => (todosQuery.data ?? []).filter((todo) => !todo.done).length,
    [todosQuery.data],
  );

  // Фильтр пишется в историю (кнопка «назад» откатывает фильтр), поиск — replace: набор текста не плодит записи
  function changeFilter(next: TodoFilter) {
    void navigate({ search: buildTodoSearch({ filter: next, q: query }) });
  }

  function changeQuery(next: string) {
    void navigate({ search: buildTodoSearch({ filter, q: next }), replace: true });
  }

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
          className="focus-ring mt-3 rounded bg-card-strong px-4 py-2 ring-1 ring-ring-soft hover:bg-ring-soft"
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
        search={query}
        onFilterChange={changeFilter}
        onSearchChange={changeQuery}
      />

      <p className="text-lg text-gray-300" aria-live="polite">
        {remaining} more to do, {(todosQuery.data?.length ?? 0) - remaining} done
      </p>

      <ul id="todo-list" className="flex flex-col gap-2" aria-label="Todo list">
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
