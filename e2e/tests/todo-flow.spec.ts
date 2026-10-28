import { expect, test } from '@playwright/test';

import { addTodo, register, STARTER_TITLES, todoRow, uniqueEmail } from './helpers';

test('an anonymous user lands on /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('sign up, CRUD, filters and session', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  // A new user starts with a ready-made todo list
  for (const title of STARTER_TITLES) {
    await expect(todoRow(page, title)).toBeVisible();
  }

  await addTodo(page, 'E2E задача');
  const item = todoRow(page, 'E2E задача');

  await item.getByRole('button', { name: 'Mark as important' }).click();
  // exact: the "Drag to reorder: <title>" handle button also contains this name
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

  // Prod build + real postgres: state survives a reload
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

test('users do not see foreign todos', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await register(pageA);
  await addTodo(pageA, 'Задача пользователя A');

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await register(pageB);
  // B has its own list with starter todos, but A's todos are not visible (starter texts are identical — check the unique one)
  await expect(todoRow(pageB, STARTER_TITLES[0])).toBeVisible();
  await expect(pageB.getByText('Задача пользователя A')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});

test('drag handle reorders and the order survives a reload', async ({ page }) => {
  await register(page);
  await addTodo(page, 'Первая');
  await addTodo(page, 'Вторая');
  await addTodo(page, 'Третья');

  const handle = page.getByRole('button', { name: 'Drag to reorder: Первая' });
  const target = todoRow(page, 'Третья');
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) {
    throw new Error('missing row coordinates for the drag');
  }

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // more than activationConstraint (4px) and in steps: dnd-kit must keep up with processing move
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  // during the drag body carries a class: it suppresses row hover states, otherwise they flicker
  await expect(page.locator('body')).toHaveClass(/todo-dragging/);
  // the dragged row is a clone in an overlay, the original stays hidden in its place
  await expect(page.locator('.todo-drag-overlay')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('body')).not.toHaveClass(/todo-dragging/);

  const titles = () => page.locator('#todo-list > li .todo-title').allTextContents();

  // Starter todos stay at the top of the list: only the added ones are reordered
  const expected = [...STARTER_TITLES, 'Вторая', 'Третья', 'Первая'].join(',');
  await expect.poll(async () => (await titles()).join(',')).toBe(expected);

  await page.reload();
  await expect(page.locator('#todo-list > li .todo-title')).toHaveText(expected.split(','));
});
