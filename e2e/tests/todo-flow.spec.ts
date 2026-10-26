import { expect, test } from '@playwright/test';

import { addTodo, register, todoRow, uniqueEmail } from './helpers';

test('аноним попадает на /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('регистрация, CRUD, фильтры и сессия', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await expect(page.getByText('No todos')).toBeVisible();

  await addTodo(page, 'E2E задача');
  const item = todoRow(page, 'E2E задача');

  await item.getByRole('button', { name: 'Mark as important' }).click();
  await expect(item.getByRole('button', { name: 'E2E задача' })).toHaveClass(/text-accent-soft/);

  await item.click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(item).toBeVisible();
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(item).toHaveCount(0);

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Search todos').fill('нет-такой');
  await expect(item).toHaveCount(0);
  await page.getByLabel('Search todos').fill('E2E');
  await expect(item).toBeVisible();

  await page.getByLabel('Search todos').fill('');
  await addTodo(page, 'Вторая задача');
  await todoRow(page, 'Вторая задача').getByRole('button', { name: 'Delete todo' }).click();
  await expect(todoRow(page, 'Вторая задача')).toHaveCount(0);

  // Прод-сборка + реальный postgres: состояние переживает перезагрузку
  await page.reload();
  await expect(item).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(item).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password-123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
  await expect(item).toBeVisible();
});

test('пользователи не видят чужие задачи', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await register(pageA);
  await addTodo(pageA, 'Задача пользователя A');

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await register(pageB);
  await expect(pageB.getByText('No todos')).toBeVisible();
  await expect(pageB.getByText('Задача пользователя A')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});
