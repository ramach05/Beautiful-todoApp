import { createEvent, createStore } from 'effector';
import type { TodoFilter } from '@bt/shared';

/**
 * Клиентское состояние страницы (ADR-002): выбранный фильтр и строка поиска.
 * Серверные задачи здесь не хранятся - только критерии их отображения.
 */
export const filterChanged = createEvent<TodoFilter>();
export const searchChanged = createEvent<string>();

/** Сброс клиентских фильтров: используется в тестах между кейсами */
export const filtersReset = createEvent();

export const $todoFilter = createStore<TodoFilter>('all')
  .on(filterChanged, (_, value) => value)
  .reset(filtersReset);
export const $todoSearch = createStore('')
  .on(searchChanged, (_, value) => value)
  .reset(filtersReset);
