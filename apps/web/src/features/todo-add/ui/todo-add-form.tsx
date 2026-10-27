import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createTodoInputSchema, type CreateTodoInput } from '@bt/shared';

import { addTodoIcon } from '@/shared/ui/assets';
import { Button } from '@/shared/ui/button';
import { fieldErrorKey } from '@/shared/i18n';
import { Spinner } from '@/shared/ui/spinner';
import { TextField } from '@/shared/ui/text-field';

import { useAddTodo } from '@/entities/todo';

/** Форма добавления: валидация общим zod-контрактом, мутация с инвалидацией кэша */
export function TodoAdd() {
  const { t } = useTranslation();
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
        {t('todos.add_heading')}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="todo-title">
          {t('todos.title_label')}
        </label>
        <TextField
          id="todo-title"
          type="text"
          className="min-w-40 flex-1 text-xl"
          placeholder={t('todos.title_placeholder')}
          autoComplete="off"
          aria-invalid={formState.errors.title !== undefined}
          aria-describedby={formState.errors.title ? 'todo-title-error' : undefined}
          {...register('title')}
        />
        <Button type="submit" size="lg" disabled={addTodo.isPending} aria-busy={addTodo.isPending}>
          {addTodo.isPending ? (
            <Spinner />
          ) : (
            <img src={addTodoIcon} alt="" aria-hidden className="size-6" />
          )}
          {t('todos.add_button')}
        </Button>
      </div>
      {formState.errors.title && (
        <p id="todo-title-error" role="alert" className="msg-in pl-1 text-base text-accent">
          {t(fieldErrorKey('title', formState.errors.title.type))}
        </p>
      )}
      {added && !addTodo.isPending && (
        <p className="msg-in pl-1 text-base text-gray-300" aria-live="polite">
          {t('todos.added')}
        </p>
      )}
    </form>
  );
}
