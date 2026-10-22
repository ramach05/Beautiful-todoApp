import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { seedTodos, filterTodos } from '../entities/todo/model';
import type { Todo, TodoFilter } from '../entities/todo/model';
import { TodoItem } from '../entities/todo/ui/todo-item';
import { TodoAdd } from '../features/todo-add/ui';
import { TodoFilterBar } from '../features/todo-filter/ui';

let nextTodoId = 101; // отсчет id новых задач продолжен с legacy-значения 100

function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>(seedTodos);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [search, setSearch] = useState('');

  const visible = filterTodos(todos, filter, search);
  const remaining = todos.filter((todo) => !todo.done).length;

  function patchTodo(id: number, patch: Partial<Todo>) {
    setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)));
  }

  return (
    <div className="flex flex-col gap-4">
      <TodoFilterBar
        filter={filter}
        search={search}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
      />

      <p className="text-lg text-gray-300" aria-live="polite">
        {remaining} more to do, {todos.length - remaining} done
      </p>

      <ul className="flex flex-col gap-2" aria-label="Список задач">
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggleDone={(id) => {
              const target = todos.find((item) => item.id === id);
              if (target) patchTodo(id, { done: !target.done });
            }}
            onToggleImportant={(id) => {
              const target = todos.find((item) => item.id === id);
              if (target && !target.done) patchTodo(id, { important: !target.important });
            }}
            onDelete={(id) => setTodos((current) => current.filter((todo) => todo.id !== id))}
          />
        ))}
        {visible.length === 0 && (
          <li className="rounded-[10px] bg-card px-3 py-6 text-center text-xl text-gray-300">
            Задач нет - добавьте первую
          </li>
        )}
      </ul>

      <TodoAdd
        onAdd={(title) =>
          setTodos((current) => [
            ...current,
            { id: nextTodoId++, title, important: false, done: false },
          ])
        }
      />
    </div>
  );
}

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Beautiful Todo' }] }),
  component: TodoPage,
});
