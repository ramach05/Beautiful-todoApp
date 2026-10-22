import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';

/** Минимальный профиль аутентифицированного пользователя для слоя данных */
export interface AppUser {
  id: string;
  email: string;
}

/** Источник пользователя запроса: better-auth в проде, фиксированная сессия в моках */
export interface SessionResolver {
  resolve(headers: Headers): Promise<AppUser | null>;
}

/** Порт репозитория задач: postgres-реализация в проде, in-memory в моках и юнитах; доступ только в рамках владельца */
export interface TodosRepository {
  list(userId: string): Promise<Todo[]>;
  create(input: CreateTodoInput, userId: string): Promise<Todo>;
  update(id: string, patch: UpdateTodoInput, userId: string): Promise<Todo | null>;
  remove(id: string, userId: string): Promise<boolean>;
}
