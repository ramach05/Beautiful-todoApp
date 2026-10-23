import { QueryClient } from '@tanstack/react-query';

/**
 * Единый QueryClient приложения: нужен и провайдеру, и роутер-лоадерам
 * (лоадеры живут вне React и не имеют доступа к хуку useQueryClient).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
