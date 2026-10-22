import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Todo, UpdateTodoInput } from '@bt/shared';

import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api';

/** Серверные данные живут только в кэше Query; Effector их не дублирует (ADR-002) */
export const todoKeys = {
  all: ['todos'] as const,
};

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: fetchTodos,
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSettled: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

/** Обновление с optimistic update: кат-даун кэша, откат на ошибке, инвалидация на settled */
export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTodoInput }) => updateTodo(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);
      queryClient.setQueryData<Todo[]>(todoKeys.all, (current) =>
        current?.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.all, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);
      queryClient.setQueryData<Todo[]>(todoKeys.all, (current) =>
        current?.filter((todo) => todo.id !== id),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.all, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}
