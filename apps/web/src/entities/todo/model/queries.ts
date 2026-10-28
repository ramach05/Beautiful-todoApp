import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';

import { api } from '@/shared/api';

/** Серверные данные живут только в кэше Query; Effector их не дублирует (ADR-002) */
export const todoKeys = {
  all: ['todos'] as const,
};

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: () => api.todos.list(),
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => api.todos.create(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

/** Обновление с optimistic update: кат-даун кэша, откат на ошибке, инвалидация на settled */
export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTodoInput }) =>
      api.todos.update({ id, patch }),
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
    mutationFn: (id: string) => api.todos.remove(id),
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

/** Перенос порядка с optimistic update: кэш выстраивается по ids до ответа, откат на ошибке */
export function useReorderTodos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.todos.reorder({ ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);
      const rank = new Map(ids.map((id, index) => [id, index]));
      queryClient.setQueryData<Todo[]>(todoKeys.all, (current) =>
        current
          ? [...current].sort(
              (a, b) => (rank.get(a.id) ?? ids.length) - (rank.get(b.id) ?? ids.length),
            )
          : current,
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
