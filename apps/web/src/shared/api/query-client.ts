import { QueryClient } from '@tanstack/react-query';

/**
 * The app's single QueryClient: needed by both the provider and route loaders
 * (loaders live outside React and have no access to the useQueryClient hook).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
