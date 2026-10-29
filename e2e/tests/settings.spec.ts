import { expect, test } from '@playwright/test';

import { register, uniqueEmail } from './helpers';

const PASSWORD = 'password-123';

test('email change is reflected in the session and the header', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  const newEmail = email.replace('e2e-', 'e2e-mail-');

  await page.goto('/settings');
  await page.getByLabel('New email').fill(newEmail);
  await page.getByRole('button', { name: 'Update email' }).click();
  await expect(page.getByRole('status')).toContainText('Email updated');

  await page.goto('/');
  await expect(page.getByTitle(newEmail)).toBeVisible();
});

test('password change rejects a wrong current password and accepts the right one', async ({
  page,
}) => {
  const email = uniqueEmail();
  await register(page, email);
  await page.goto('/settings');

  await page.getByLabel('Current password').fill('wrong-password');
  await page.getByLabel('New password').fill('password-456');
  await page.getByRole('button', { name: 'Change password', exact: true }).click();
  await expect(page.locator('#settings-current-password-error')).toContainText(
    'Failed to change password',
  );

  await page.getByLabel('Current password').fill(PASSWORD);
  await page.getByLabel('New password').fill('password-456');
  await page.getByRole('button', { name: 'Change password', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Password updated');

  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password-456');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
});

test('sign out everywhere lands on login with no session', async ({ page }) => {
  await register(page);
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign out everywhere' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  // The cookie is gone: protected routes bounce back to login
  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('account deletion asks for confirmation and blocks the next sign-in', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await page.goto('/settings');

  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Delete account' }).click();
  await expect(page.getByRole('heading', { name: 'Delete account?' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('#login-password-error')).not.toBeEmpty();
  await expect(page).toHaveURL('/login');
});
