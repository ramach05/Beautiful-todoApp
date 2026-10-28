import type { AppLocale, CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';

/** Minimal authenticated-user profile for the data layer */
export interface AppUser {
  id: string;
  email: string;
  locale: AppLocale;
}

/** Source of the request user: better-auth in prod, a fixed session in mocks */
export interface SessionResolver {
  resolve(headers: Headers): Promise<AppUser | null>;
}

/** Todos repository port: postgres implementation in prod, in-memory in mocks and unit tests; access is owner-scoped only */
export interface TodosRepository {
  list(userId: string): Promise<Todo[]>;
  create(input: CreateTodoInput, userId: string): Promise<Todo>;
  update(id: string, patch: UpdateTodoInput, userId: string): Promise<Todo | null>;
  remove(id: string, userId: string): Promise<boolean>;
  reorder(ids: string[], userId: string): Promise<Todo[]>;
}
