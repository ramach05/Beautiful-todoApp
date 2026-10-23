import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTodoInputSchema, type CreateTodoInput } from '@bt/shared';
import { addTodoIcon } from '@/shared/ui/assets';

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
    <form className="flex flex-col gap-1" onSubmit={(event) => void onSubmit(event)}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className={
            'min-w-0 flex-1 rounded-[10px] bg-card-strong px-3 py-2 text-xl ' +
            'ring-1 ring-ring-soft placeholder:text-gray-400 focus:ring-white focus:outline-none'
          }
          placeholder="New todo"
          autoComplete="off"
          aria-label="New todo title"
          aria-invalid={formState.errors.title !== undefined}
          {...register('title')}
        />
        <button
          type="submit"
          className={
            'flex items-center gap-2 rounded-[10px] bg-card-strong px-3 py-2 text-xl ' +
            'ring-1 ring-accent-soft transition-colors hover:bg-ring-soft disabled:opacity-40'
          }
          disabled={addTodo.isPending}
        >
          <img src={addTodoIcon} alt="" className="size-6" />
          Add Todo
        </button>
      </div>
      {formState.errors.title && (
        <p role="alert" className="pl-1 text-base text-accent">
          {formState.errors.title.message}
        </p>
      )}
      {added && !addTodo.isPending && (
        <p className="pl-1 text-base text-gray-300" aria-live="polite">
          Todo added
        </p>
      )}
    </form>
  );
}
