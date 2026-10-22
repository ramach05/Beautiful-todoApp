import { expect, test } from '@playwright/test';

import { addTodo, register, todoRow, uniqueEmail } from './helpers';

test('аноним попадает на /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('регистрация, CRUD, фильтры и сессия', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await expect(page.getByText('Задач нет - добавьте первую')).toBeVisible();

  await addTodo(page, 'E2E задача');
  const item = todoRow(page, 'E2E задача');

  await item.getByRole('button', { name: 'Пометить как важную' }).click();
  await expect(item.locator('p')).toHaveClass(/text-accent-soft/);

  await item.click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(item).toBeVisible();
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(item).toHaveCount(0);

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Поиск задач').fill('нет-такой');
  await expect(item).toHaveCount(0);
  await page.getByLabel('Поиск задач').fill('E2E');
  await expect(item).toBeVisible();

  await page.getByLabel('Поиск задач').fill('');
  await addTodo(page, 'Вторая задача');
  await todoRow(page, 'Вторая задача').getByRole('button', { name: 'Удалить задачу' }).click();
  await expect(todoRow(page, 'Вторая задача')).toHaveCount(0);

  // Прод-сборка + реальный postgres: состояние переживает перезагрузку
  await page.reload();
  await expect(item).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(item).toBeVisible();

  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill('password-123');
  await page.getByRole('button', { name: 'Войти' }).click();
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
  await expect(pageB.getByText('Задач нет - добавьте первую')).toBeVisible();
  await expect(pageB.getByText('Задача пользователя A')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});
