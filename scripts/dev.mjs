/**
 * Local one-command startup: env files -> postgres -> migrations -> seed -> dev servers.
 * Usage: pnpm start
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Run a command in the repo root; on a non-zero exit code — fail with the error text */
function run(cmd, args, hint) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    if (result.error) console.error(`Failed to start "${cmd}": ${result.error.message}`);
    if (hint) console.error(hint);
    process.exit(result.status ?? 1);
  }
}

if (Number(process.versions.node.split('.')[0]) < 24) {
  console.error(`Node.js >= 24 is required, currently ${process.versions.node}. Run "nvm use".`);
  process.exit(1);
}

// .env files are created from the examples; the web config force-disables the mock so the real api is used
for (const app of ['api', 'web']) {
  const envPath = join(root, 'apps', app, '.env');
  const examplePath = `${envPath}.example`;
  if (!existsSync(envPath)) {
    writeFileSync(envPath, readFileSync(examplePath, 'utf8'));
    console.log(`Created apps/${app}/.env from the example`);
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
  'Failed to start postgres. Make sure Docker is running.',
);
// Every run resets the dev DB to the seed state: volume data does not survive a restart
console.log('\nThe dev DB will be reset to the seed state: all local data will be deleted.');
run('pnpm', ['--filter', '@bt/api', 'db:reset']);
run('pnpm', ['--filter', '@bt/api', 'db:migrate']);
run('pnpm', ['--filter', '@bt/api', 'db:seed']);
run('pnpm', ['dev']);
