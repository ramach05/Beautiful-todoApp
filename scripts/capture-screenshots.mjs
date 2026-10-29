import { createRequire } from 'node:module';
import { execFileSync, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// @playwright/test resolves from the e2e workspace where it is declared
const requireFromE2e = createRequire(path.join(import.meta.dirname, '../e2e/package.json'));
const { chromium, expect } = requireFromE2e('@playwright/test');

const repoRoot = path.resolve(import.meta.dirname, '..');
const shotsDir = path.join(repoRoot, 'docs/screenshots');
const API_PORT = 3102;
const WEB_PORT = 4181;
const API_ORIGIN = `http://127.0.0.1:${API_PORT}`;
const ORIGIN = `http://127.0.0.1:${WEB_PORT}`;
// Separate database: the capture never touches the dev or e2e data
const CAPTURE_DB = 'beautiful_todo_capture';
const CAPTURE_DB_URL = `postgres://todo:todo@localhost:5433/${CAPTURE_DB}`;
const EMAIL = 'ada@prettytodo.app';
const PASSWORD = 'password-123';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const TITLE = { en: 'Beautiful Todo List', ru: 'Красивый список задач' };
const GIF_FPS = 8;

function pnpmRun(args, opts = {}) {
  execFileSync('pnpm', args, { cwd: repoRoot, stdio: 'inherit', ...opts });
}

/** Detached spawn: cleanup can kill the whole process group (pnpm wraps the node child) */
function spawnGroup(command, args, opts) {
  return spawn(command, args, { detached: true, stdio: 'ignore', ...opts });
}

function killGroup(child) {
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    // already dead
  }
}

async function waitForUrl(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`server did not answer on ${url}`);
}

/** Same harness as e2e: prod builds on a dedicated postgres — screenshots show the real app */
function prepareDatabase() {
  execFileSync('docker', ['compose', 'up', '-d', 'postgres'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'sh',
      '-c',
      'until pg_isready -U todo -q; do sleep 1; done',
    ],
    { cwd: repoRoot, stdio: 'ignore' },
  );
  // Two separate -c flags: psql wraps one -c into a transaction, DROP DATABASE is forbidden there
  execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'psql',
      '-U',
      'todo',
      '-d',
      'postgres',
      '-c',
      `DROP DATABASE IF EXISTS ${CAPTURE_DB} WITH (FORCE)`,
      '-c',
      `CREATE DATABASE ${CAPTURE_DB}`,
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  );
  pnpmRun(['--filter', '@bt/api', 'exec', 'drizzle-kit', 'migrate'], {
    env: { ...process.env, DATABASE_URL: CAPTURE_DB_URL },
  });
}

function buildApps() {
  pnpmRun(['--filter', '@bt/api', 'build']);
  execSync('pnpm --filter @bt/web build', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_API_URL: `${API_ORIGIN}/rpc`,
      VITE_AUTH_URL: `${API_ORIGIN}/api/auth`,
    },
  });
}

function startApi() {
  const child = spawnGroup('pnpm', ['--filter', '@bt/api', 'start'], {
    env: {
      ...process.env,
      DATABASE_URL: CAPTURE_DB_URL,
      HOST: '127.0.0.1',
      PORT: String(API_PORT),
      CORS_ORIGIN: ORIGIN,
    },
  });
  return child;
}

function startPreview() {
  // --host 127.0.0.1: preview defaults to localhost which may bind IPv6 only
  return spawnGroup('pnpm', [
    '--filter',
    '@bt/web',
    'exec',
    'vite',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(WEB_PORT),
    '--strictPort',
  ]);
}

function shot(page, rel, { fullPage = true } = {}) {
  const file = path.join(shotsDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return page.screenshot({ path: file, fullPage }).then(() => {
    console.log(`shot ${rel} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  });
}

/** Background image + entrance/view transitions must finish before the frame is taken */
async function settle(page, ms = 700) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
}

const row = (page, title) => page.getByRole('listitem').filter({ hasText: title });

async function fillRegisterForm(page) {
  await page.getByLabel('Name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
}

async function fillLoginForm(page) {
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
}

async function signIn(page) {
  await page.goto(`${ORIGIN}/login`);
  await fillLoginForm(page);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(`${ORIGIN}/`);
}

async function openTodoApp(page) {
  await signIn(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE.en);
  await expect(row(page, 'Buy groceries')).toBeVisible();
  await settle(page);
}

/** One created todo + done x2 + one important: the state for hero shots and a populated chart */
async function markShowcaseTodos(page) {
  await page.getByLabel('New todo title').fill('Water the plants');
  await page.getByRole('button', { name: 'Add Todo' }).click();
  await expect(row(page, 'Water the plants')).toBeVisible();
  await row(page, 'Call mom').getByRole('button', { name: 'Call mom', exact: true }).click();
  await row(page, 'Water the plants')
    .getByRole('button', { name: 'Water the plants', exact: true })
    .click();
  await row(page, 'Do homework').getByRole('button', { name: 'Mark as important' }).click();
  await expect(page.getByText('2 done')).toBeVisible();
}

async function openStats(page) {
  await page.getByRole('link', { name: 'Stats' }).click();
  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();
  // view transition + Query settle must finish before the screenshot
  await page.waitForTimeout(800);
}

function frameCollector(framesDir) {
  let index = 0;
  return async (page) => {
    const file = path.join(framesDir, `frame_${String(index).padStart(3, '0')}.png`);
    index += 1;
    await page.screenshot({ path: file });
  };
}

/** Palette-based gif: crisp UI text without the 256-color banding */
function assembleGif(framesDir, outFile) {
  execFileSync('ffmpeg', [
    '-y',
    '-framerate',
    String(GIF_FPS),
    '-i',
    path.join(framesDir, 'frame_%03d.png'),
    '-vf',
    'scale=960:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    '-loop',
    '0',
    outFile,
  ]);
  console.log(`gif ${path.basename(outFile)} (${Math.round(fs.statSync(outFile).size / 1024)} KB)`);
}

async function captureDesktop(browser) {
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();

  await page.goto(`${ORIGIN}/login`);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await settle(page);
  await shot(page, 'desktop/login.png');

  await page.getByRole('link', { name: 'No account? Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
  await settle(page);
  await fillRegisterForm(page);
  await shot(page, 'desktop/register.png');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(`${ORIGIN}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE.en);

  await markShowcaseTodos(page);
  await shot(page, 'desktop/todo.png');

  await openStats(page);
  await shot(page, 'desktop/stats.png');

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, 'desktop/settings.png');

  await page.getByRole('link', { name: 'Todo' }).click();
  await expect(row(page, 'Buy groceries')).toBeVisible();
  await settle(page, 300);
  await page.getByRole('button', { name: 'Русский' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE.ru);
  await page.waitForTimeout(300);
  await shot(page, 'desktop/ru.png');
  // Return the profile to English: later contexts sign in as the same user
  await page.getByRole('button', { name: 'English' }).click();

  await context.close();
}

async function captureMobile(browser) {
  const context = await browser.newContext({ viewport: MOBILE });
  const page = await context.newPage();
  await openTodoApp(page);
  await shot(page, 'mobile/todo.png');

  await openStats(page);
  await shot(page, 'mobile/stats.png');
  await context.close();

  const anon = await browser.newContext({ viewport: MOBILE });
  const anonPage = await anon.newPage();
  await anonPage.goto(`${ORIGIN}/register`);
  await expect(anonPage.getByRole('heading', { name: 'Sign up' })).toBeVisible();
  await settle(anonPage);
  await fillRegisterForm(anonPage);
  await shot(anonPage, 'mobile/register.png');
  await anon.close();
}

async function captureReorderGif(browser) {
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  await openTodoApp(page);
  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bt-reorder-'));
  const frame = frameCollector(framesDir);
  try {
    await frame(page);
    const handle = page.getByRole('button', { name: 'Drag to reorder: Buy groceries' });
    const box = await handle.boundingBox();
    if (!box) throw new Error('drag handle not found');
    const x = box.x + box.width / 2;
    let y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 10, { steps: 4 });
    for (let step = 0; step < 10; step += 1) {
      y += 14;
      await page.mouse.move(x, y, { steps: 3 });
      await frame(page);
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
    await frame(page);
    assembleGif(framesDir, path.join(shotsDir, 'reorder.gif'));
  } finally {
    fs.rmSync(framesDir, { recursive: true, force: true });
    await context.close();
  }
}

async function captureLocaleGif(browser) {
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  await openTodoApp(page);
  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bt-locale-'));
  const frame = frameCollector(framesDir);
  try {
    await frame(page);
    await page.getByRole('button', { name: 'Русский' }).click();
    await page.waitForTimeout(300);
    await frame(page);
    await page.waitForTimeout(900);
    await frame(page);
    await page.getByRole('button', { name: 'English' }).click();
    await page.waitForTimeout(300);
    await frame(page);
    assembleGif(framesDir, path.join(shotsDir, 'locale-switch.gif'));
  } finally {
    fs.rmSync(framesDir, { recursive: true, force: true });
    await context.close();
  }
}

prepareDatabase();
buildApps();
const api = startApi();
const preview = startPreview();
let browser;
try {
  await waitForUrl(`${API_ORIGIN}/health`);
  await waitForUrl(ORIGIN);
  browser = await chromium.launch();
  await captureDesktop(browser);
  await captureMobile(browser);
  await captureReorderGif(browser);
  await captureLocaleGif(browser);
} finally {
  await browser?.close();
  killGroup(preview);
  killGroup(api);
}

execFileSync('node', ['scripts/make-og-image.mjs', 'docs/screenshots/desktop/todo.png'], {
  cwd: repoRoot,
  stdio: 'inherit',
});
console.log('done');
