import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTodoInputSchema, type CreateTodoInput } from '@bt/shared';
import { addTodoIcon } from '@/shared/ui/assets';
import { Spinner } from '@/shared/ui/spinner';

import { useAddTodo } from '@/entities/todo';

/** Форма добавления: валидация общим zod-контрактом, мутация с инвалидацией кэша */
export function TodoAdd() {
  const addTodo = useAddTodo();
  const [added, setAdded] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoInputSchema),
    defaultValues: { title: '' },
  });

  const onSubmit = handleSubmit((values) => {
    addTodo.mutate(values, {
      onSuccess: () => {
        reset({ title: '' });
        setAdded(true);
      },
    });
  });

  return (
    <form
      className="flex flex-col gap-1"
      aria-labelledby="todo-add-heading"
      onSubmit={(event) => void onSubmit(event)}
    >
      <h2 id="todo-add-heading" className="sr-only">
        Add a todo
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="todo-title">
          New todo title
        </label>
        <input
          id="todo-title"
          type="text"
          className={
            'focus-ring min-w-40 flex-1 rounded-[10px] bg-card-strong px-3 py-2 text-xl ' +
            'ring-1 ring-ring-soft placeholder:text-gray-400 focus:ring-white focus:outline-none'
          }
          placeholder="New todo"
          autoComplete="off"
          aria-invalid={formState.errors.title !== undefined}
          aria-describedby={formState.errors.title ? 'todo-title-error' : undefined}
          {...register('title')}
        />
        <button
          type="submit"
          className={
            'focus-ring lift inline-flex items-center gap-2 rounded-[10px] bg-card-strong px-3 py-2 text-xl ' +
            'ring-1 ring-accent-soft hover:bg-ring-soft disabled:opacity-40'
          }
          disabled={addTodo.isPending}
          aria-busy={addTodo.isPending}
        >
          {addTodo.isPending ? (
            <Spinner />
          ) : (
            <img src={addTodoIcon} alt="" aria-hidden className="size-6" />
          )}
          Add Todo
        </button>
      </div>
      {formState.errors.title && (
        <p id="todo-title-error" role="alert" className="msg-in pl-1 text-base text-accent">
          {formState.errors.title.message}
        </p>
      )}
      {added && !addTodo.isPending && (
        <p className="msg-in pl-1 text-base text-gray-300" aria-live="polite">
          Todo added
        </p>
      )}
    </form>
  );
}
