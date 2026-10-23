/**
 * Локальный запуск одной командой: env-файлы -> postgres -> миграции -> сид -> dev-серверы.
 * Использование: pnpm start
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Запуск команды в корне репозитория; при ненулевом коде — падение с текстом ошибки */
function run(cmd, args, hint) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    if (result.error) console.error(`Не удалось запустить "${cmd}": ${result.error.message}`);
    if (hint) console.error(hint);
    process.exit(result.status ?? 1);
  }
}

if (Number(process.versions.node.split('.')[0]) < 24) {
  console.error(`Нужен Node.js >= 24, сейчас ${process.versions.node}. Выполните "nvm use".`);
  process.exit(1);
}

// .env создаются из примеров; в web-конфиге принудительно выключается мок, чтобы работал реальный api
for (const app of ['api', 'web']) {
  const envPath = join(root, 'apps', app, '.env');
  const examplePath = `${envPath}.example`;
  if (!existsSync(envPath)) {
    writeFileSync(envPath, readFileSync(examplePath, 'utf8'));
    console.log(`Создан apps/${app}/.env из примера`);
  }
  if (app === 'web') {
    const content = readFileSync(envPath, 'utf8');
    const fixed = /^VITE_USE_MOCKS=.*$/m.test(content)
      ? content.replace(/^VITE_USE_MOCKS=.*$/m, 'VITE_USE_MOCKS=0')
      : `${content.trimEnd()}\nVITE_USE_MOCKS=0\n`;
    if (fixed !== content) writeFileSync(envPath, fixed);
  }
}

run(
  'docker',
  ['compose', 'up', '-d', '--wait', 'postgres'],
  'Не удалось поднять postgres. Проверьте, что Docker запущен.',
);
// Dev-БД каждый запуск приводится к сид-состоянию: данные из volume не переживают перезапуск
console.log('\nDev-БД будет сброшена к сид-состоянию: все локальные данные будут удалены.');
run('pnpm', ['--filter', '@bt/api', 'db:reset']);
run('pnpm', ['--filter', '@bt/api', 'db:migrate']);
run('pnpm', ['--filter', '@bt/api', 'db:seed']);
run('pnpm', ['dev']);
