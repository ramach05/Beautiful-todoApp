import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';

/** Порт репозитория задач: postgres-реализация в проде, in-memory в моках и юнитах */
export interface TodosRepository {
  list(): Promise<Todo[]>;
  create(input: CreateTodoInput): Promise<Todo>;
  update(id: string, patch: UpdateTodoInput): Promise<Todo | null>;
  remove(id: string): Promise<boolean>;
}
