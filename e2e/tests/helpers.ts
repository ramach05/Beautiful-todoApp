import { expect, type Locator, type Page } from '@playwright/test';

let seq = 0;

/** Уникальный email: повторы прогонов не сталкиваются на unique-индексе */
export function uniqueEmail(): string {
  seq += 1;
  return `e2e-${Date.now()}-${seq}@test.local`;
}

export async function register(page: Page, email = uniqueEmail()): Promise<void> {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Нет аккаунта? Зарегистрироваться' }).click();
  await page.getByLabel('Имя').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill('password-123');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page).toHaveURL('/');
}

export async function addTodo(page: Page, title: string): Promise<void> {
  await page.getByLabel('Заголовок новой задачи').fill(title);
  await page.getByRole('button', { name: 'Add Todo' }).click();
  await expect(todoRow(page, title)).toBeVisible();
}

export function todoRow(page: Page, title: string): Locator {
  return page.getByRole('listitem').filter({ hasText: title });
}
