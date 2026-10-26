import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { register } from './helpers';

interface Screen {
  path: string;
  /** Признак того, что экран отрисован: без него axe снял бы каркас загрузки */
  ready: (page: Page) => Locator;
  /** Нужна ли сессия: авторизованные экраны открываем после регистрации */
  auth: boolean;
}

const anonymousScreens: Screen[] = [
  { path: '/login', ready: (p) => p.getByRole('heading', { name: 'Sign in' }), auth: false },
  { path: '/register', ready: (p) => p.getByRole('heading', { name: 'Sign up' }), auth: false },
  { path: '/no-such-route', ready: (p) => p.getByText('Page not found'), auth: false },
];

const authScreens: Screen[] = [
  { path: '/', ready: (p) => p.getByText(/more to do/), auth: true },
  { path: '/stats', ready: (p) => p.getByRole('heading', { name: 'Statistics' }), auth: true },
  { path: '/settings', ready: (p) => p.getByRole('heading', { name: 'Settings' }), auth: true },
];

/**
 * Проверка текущей страницы accessibility-движком: критические и serious нарушения собираются
 * в читаемый список, остальные возвращаем отдельным списком для лога.
 */
async function collectViolations(page: Page): Promise<{ blocking: string[]; other: string[] }> {
  const results = await new AxeBuilder({ page }).analyze();
  const format = (list: typeof results.violations) =>
    list.map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
          .map((node) => node.target.join(' '))
          .join(' | ')}`,
    );
  return {
    blocking: format(
      results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'),
    ),
    other: format(
      results.violations.filter((v) => v.impact !== 'critical' && v.impact !== 'serious'),
    ),
  };
}

/** Проходит список экранов и собирает нарушения по каждому: падает в конце, показывая все экраны сразу */
async function checkScreens(page: Page, screens: Screen[]): Promise<void> {
  const found: string[] = [];
  for (const screen of screens) {
    await page.goto(screen.path);
    await expect(screen.ready(page)).toBeVisible();
    const { blocking, other } = await collectViolations(page);
    if (other.length > 0) {
      console.log(`[a11y] ${screen.path}: не блокирующие — ${other.join('; ')}`);
    }
    found.push(...blocking.map((line) => `${screen.path} -> ${line}`));
  }
  expect(found).toEqual([]);
}

for (const viewport of [
  { name: 'desktop', size: { width: 1280, height: 720 } },
  { name: 'mobile 390x844', size: { width: 390, height: 844 } },
]) {
  test.describe(`a11y: ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test('публичные экраны без critical/serious нарушений', async ({ page }) => {
      await checkScreens(page, anonymousScreens);
    });

    test('экраны пользователя без critical/serious нарушений', async ({ page }) => {
      await register(page);
      await checkScreens(page, authScreens);
    });
  });
}
