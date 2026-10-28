import { expect, type Locator, type Page } from '@playwright/test';

// Starter todos are created on registration (databaseHooks on the api side)
export const STARTER_TITLES = ['Buy groceries', 'Call mom', 'Do homework'] as const;

let seq = 0;

/** Unique email: repeated runs do not collide on the unique index */
export function uniqueEmail(): string {
  seq += 1;
  return `e2e-${Date.now()}-${seq}@test.local`;
}

export async function register(page: Page, email = uniqueEmail()): Promise<void> {
  await page.goto('/login');
  await page.getByRole('link', { name: 'No account? Sign up' }).click();
  await page.getByLabel('Name').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  // exact: an eye field with aria-label "Show password" appeared next to it — a substring match caught the button too
  await page.getByLabel('Password', { exact: true }).fill('password-123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');
}

export async function addTodo(page: Page, title: string): Promise<void> {
  await page.getByLabel('New todo title').fill(title);
  await page.getByRole('button', { name: 'Add Todo' }).click();
  await expect(todoRow(page, title)).toBeVisible();
}

export function todoRow(page: Page, title: string): Locator {
  return page.getByRole('listitem').filter({ hasText: title });
}
