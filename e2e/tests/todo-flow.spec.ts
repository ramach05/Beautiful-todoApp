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
  // exact: кнопка-ручка "Drag to reorder: E2E задача" тоже содержит это имя
  await expect(item.getByRole('button', { name: 'E2E задача', exact: true })).toHaveClass(
    /text-accent-soft/,
  );

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
  await page.getByLabel('Password', { exact: true }).fill('password-123');
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

test('drag handle меняет порядок и он переживает перезагрузку', async ({ page }) => {
  await register(page);
  await addTodo(page, 'Первая');
  await addTodo(page, 'Вторая');
  await addTodo(page, 'Третья');

  const handle = page.getByRole('button', { name: 'Drag to reorder: Первая' });
  const target = todoRow(page, 'Третья');
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) {
    throw new Error('Не найдены координаты строк для перетаскивания');
  }

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // больше activationConstraint (4px) и шагами: dnd-kit должен успевать обрабатывать move
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();

  const titles = () => page.locator('#todo-list > li .todo-title').allTextContents();

  await expect.poll(async () => (await titles()).join(',')).toBe('Вторая,Третья,Первая');

  await page.reload();
  await expect(page.locator('#todo-list > li .todo-title')).toHaveText([
    'Вторая',
    'Третья',
    'Первая',
  ]);
});
