import { expect, test } from '@playwright/test';

import { register } from './helpers';

const title = { en: 'Beautiful Todo List', ru: 'Красивый список задач' } as const;

test('language switch localizes the UI and persists across a reload', async ({ page }) => {
  await register(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title.en);

  await page.getByRole('button', { name: 'Русский' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title.ru);

  // Locale is stored on the user profile: a fresh load applies ru before the first paint settles
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title.ru);

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title.en);
});
