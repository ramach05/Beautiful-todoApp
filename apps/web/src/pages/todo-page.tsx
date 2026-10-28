import { useNavigate, useSearch } from '@tanstack/react-router';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TodoAdd } from '@/features/todo-add';
import { buildTodoSearch, TodoFilterBar } from '@/features/todo-filter';
import { SortableTodoItem, TodoDndContext } from '@/features/todo-reorder';
import {
  type Todo,
  type TodoFilter,
  filterTodos,
  reorderTodos,
  useDeleteTodo,
  useReorderTodos,
  useTodos,
  useUpdateTodo,
} from '@/entities/todo';
import { cn } from '@/shared/lib';
import { Skeleton, SkeletonBlock } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';

/** Сколько первых строк списка получают stagger-entrance и шаг задержки между ними, мс */
const ENTRANCE_LIMIT = 8;
const ENTRANCE_STEP = 55;

/** Каркас списка на время загрузки задач: строки той же высоты, что реальные задачи */
function TodoListSkeleton() {
  const { t } = useTranslation();
  return (
    <Skeleton label={t('todos.loading')} className="flex flex-col gap-2">
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

/** Локальный порядок дропа, живой, пока кэш не обновился; base — данные кэша на момент дропа */
interface DropOrder {
  ids: string[];
  base: Todo[] | undefined;
}

/**
 * Страница todo: серверные задачи из Query, фильтр и поиск из URL (ADR-002).
 */
export function TodoPage() {
  const { t } = useTranslation();
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const todosQuery = useTodos();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const reorderTodo = useReorderTodos();

  const filter: TodoFilter = search.filter ?? 'all';
  const query = search.q ?? '';

  // Порядок дропа держим в локальном state: уведомление кэша Query приходит в макрозадаче
  // setTimeout, и без локального порядка список рисует кадр в старом порядке между этими состояниями
  const [dropOrder, setDropOrder] = useState<DropOrder | null>(null);

  const fullTodos = useMemo(() => {
    const data = todosQuery.data ?? [];
    // Локальный порядок действителен только для данных, на которых создан: оптимистичный
    // порядок или откат дают новую ссылку — она сама становится источником порядка
    if (dropOrder === null || dropOrder.base !== todosQuery.data) return data;
    const rank = new Map(dropOrder.ids.map((id, index) => [id, index]));
    return [...data].sort(
      (a, b) => (rank.get(a.id) ?? data.length) - (rank.get(b.id) ?? data.length),
    );
  }, [todosQuery.data, dropOrder]);

  const todos = useMemo(() => filterTodos(fullTodos, filter, query), [fullTodos, filter, query]);
  const remaining = useMemo(
    () => (todosQuery.data ?? []).filter((todo) => !todo.done).length,
    [todosQuery.data],
  );
  // Стабильный массив id: dnd-kit пересобирает раскладки на каждое движение указателя,
  // новый массив на рендер заставлял бы пересчитывать их заново и ронял бы переходы строк
  const ids = useMemo(() => todos.map((todo) => todo.id), [todos]);

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

  // Порядок пересчитываем по полному списку: при фильтре часть задач скрыта,
  // но перенос к цели в полном массиве дает предсказуемый результат
  function reorder(draggedId: string, overId: string) {
    const next = reorderTodos(fullTodos, draggedId, overId);
    if (next === fullTodos) return;
    const orderedIds = next.map((todo) => todo.id);
    setDropOrder({ ids: orderedIds, base: todosQuery.data });
    reorderTodo.mutate(orderedIds);
  }

  if (todosQuery.isPending) {
    return <TodoListSkeleton />;
  }

  if (todosQuery.isError) {
    return (
      <div className="msg-in py-10 text-center" role="alert">
        <p className="text-xl text-accent">{t('todos.load_failed')}</p>
        <Button variant="ghost" className="mt-3" onClick={() => void todosQuery.refetch()}>
          {t('common.retry')}
        </Button>
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
        {t('todos.count', {
          count: remaining,
          done: (todosQuery.data?.length ?? 0) - remaining,
        })}
      </p>

      <TodoDndContext ids={ids} todos={todos} query={query} onReorder={reorder}>
        <ul
          id="todo-list"
          className={cn('flex flex-col gap-2', entrance && 'row-entrance')}
          aria-label={t('todos.list_aria')}
        >
          {todos.map((todo, index) => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              query={query}
              entranceDelay={entrance && index < ENTRANCE_LIMIT ? index * ENTRANCE_STEP : undefined}
              onToggleDone={toggleDone}
              onToggleImportant={toggleImportant}
              onDelete={(id) => deleteTodo.mutate(id)}
            />
          ))}
          {todos.length === 0 && (
            <li className="rounded-[10px] bg-card px-3 py-6 text-center text-xl text-gray-300">
              {t('todos.empty')}
            </li>
          )}
        </ul>
      </TodoDndContext>

      <TodoAdd />
    </div>
  );
}
