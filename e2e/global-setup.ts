import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const E2E_DB = 'beautiful_todo_e2e';
const E2E_DB_URL = `postgres://todo:todo@localhost:5433/${E2E_DB}`;
// Two separate -c flags: psql wraps all statements of a single -c in a transaction, and DROP DATABASE is forbidden there
const RECREATE_ARGS = [
  '-c',
  `DROP DATABASE IF EXISTS ${E2E_DB} WITH (FORCE)`,
  '-c',
  `CREATE DATABASE ${E2E_DB}`,
];

function recreateDatabase(): void {
  if (process.env.CI) {
    // In CI postgres runs as a gh-runner service container, the psql client is preinstalled there
    execFileSync('psql', ['postgres://todo:todo@localhost:5433/postgres', ...RECREATE_ARGS], {
      stdio: 'inherit',
    });
    return;
  }
  execFileSync('docker', ['compose', 'up', '-d', 'postgres'], { cwd: repoRoot, stdio: 'ignore' });
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
  execFileSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres', 'psql', '-U', 'todo', '-d', 'postgres', ...RECREATE_ARGS],
    { cwd: repoRoot, stdio: 'inherit' },
  );
}

/** A clean database on every run: e2e is reproducible regardless of previous runs */
export default async function globalSetup(): Promise<void> {
  recreateDatabase();
  execFileSync('pnpm', ['--filter', '@bt/api', 'exec', 'drizzle-kit', 'migrate'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: E2E_DB_URL },
  });
}
