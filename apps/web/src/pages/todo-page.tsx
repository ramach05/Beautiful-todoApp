import { useNavigate, useSearch } from '@tanstack/react-router';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

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
import { cn } from '@/shared/lib';
import { Skeleton, SkeletonBlock } from '@/shared/ui/skeleton';

/** Сколько первых строк списка получают stagger-entrance и шаг задержки между ними, мс */
const ENTRANCE_LIMIT = 8;
const ENTRANCE_STEP = 55;

/** Каркас списка на время загрузки задач: строки той же высоты, что реальные задачи */
function TodoListSkeleton() {
  return (
    <Skeleton label="Loading todos" className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 rounded-[10px] bg-card-strong px-3 py-2"
        >
          <SkeletonBlock className="h-7 w-2/3" />
          <SkeletonBlock className="h-6 w-14" />
        </div>
      ))}
    </Skeleton>
  );
}

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

  const [entrance, setEntrance] = useState(false);
  const entranceStarted = useRef(false);

  // Entrance только на первичном приходе данных: класс висит до конца stagger и снимается,
  // поэтому апдейты, поиск и последующие добавления анимацию не перетриггерят
  useLayoutEffect(() => {
    if (todosQuery.data === undefined || entranceStarted.current) return;
    entranceStarted.current = true;
    setEntrance(true);
    const timer = setTimeout(() => setEntrance(false), ENTRANCE_LIMIT * ENTRANCE_STEP + 450);
    return () => clearTimeout(timer);
  }, [todosQuery.data]);

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
    return <TodoListSkeleton />;
  }

  if (todosQuery.isError) {
    return (
      <div className="msg-in py-10 text-center" role="alert">
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

      <ul
        id="todo-list"
        className={cn('flex flex-col gap-2', entrance && 'row-entrance')}
        aria-label="Todo list"
      >
        {todos.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            entranceDelay={entrance && index < ENTRANCE_LIMIT ? index * ENTRANCE_STEP : undefined}
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
