import { expect, it } from 'vitest';

import { appContract, todoContract } from './contract.js';
import { reorderTodosInputSchema, todoFilterSchema } from './todo.js';

// Keep mutable-package tests flat (no describe): the Stryker per-test filter with vitest 5
// does not match nested tests, so mutants survive even when covered.

it('the contract exposes exactly the todo procedures', () => {
  expect(Object.keys(appContract)).toEqual(['todos']);
  expect(Object.keys(todoContract).sort()).toEqual([
    'create',
    'list',
    'remove',
    'reorder',
    'update',
  ]);
});

it('every filter value parses: renaming an enum member breaks parsing', () => {
  expect(todoFilterSchema.safeParse('all').success).toBe(true);
  expect(todoFilterSchema.safeParse('active').success).toBe(true);
  expect(todoFilterSchema.safeParse('done').success).toBe(true);
});

it('reorder requires at least one id and only accepts uuids', () => {
  expect(reorderTodosInputSchema.safeParse({ ids: [] }).success).toBe(false);
  expect(reorderTodosInputSchema.safeParse({ ids: ['not-a-uuid'] }).success).toBe(false);
  expect(reorderTodosInputSchema.safeParse({ ids: [crypto.randomUUID()] }).success).toBe(true);
});
