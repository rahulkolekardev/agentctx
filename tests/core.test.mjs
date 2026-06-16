import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  scanRepo,
  detectSecretsInText,
  generateAgentsMd,
  doctor,
  createTaskPack,
  generateContextFiles,
  writeRepoMap,
  rankTaskFiles
} from '../skills/agentctx/scripts/core.mjs';

const repoRoot = path.resolve('.');
const nextRoot = path.join(repoRoot, 'examples/nextjs-app');
const expressRoot = path.join(repoRoot, 'examples/express-api');

function tempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agentctx-test-'));
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

test('detects pnpm package manager from packageManager and lockfile', () => {
  const facts = scanRepo(nextRoot);
  assert.equal(facts.packageManager.value, 'pnpm');
  assert.equal(facts.framework.value, 'nextjs');
  assert.equal(facts.language.typescript, true);
});

test('prefers package.json packageManager over lockfile conflict', () => {
  const dir = tempRepo();
  write(path.join(dir, 'package.json'), JSON.stringify({ name: 'conflict', packageManager: 'pnpm@9.0.0', scripts: { test: 'vitest run' } }));
  write(path.join(dir, 'package-lock.json'), '{}');
  const facts = scanRepo(dir);
  assert.equal(facts.packageManager.value, 'pnpm');
  assert.equal(facts.risks.some(r => r.code === 'PACKAGE_MANAGER_CONFLICT'), true);
});

test('detects Express from dependencies', () => {
  const facts = scanRepo(expressRoot);
  assert.equal(facts.framework.value, 'express');
  assert.equal(facts.packageManager.value, 'npm');
});

test('generates commands only when scripts exist', () => {
  const facts = scanRepo(expressRoot);
  assert.equal(facts.commands.test, 'npm test');
  assert.equal(facts.commands.build, undefined);
});

test('AGENTS.md generator does not include fake test command when missing', () => {
  const dir = tempRepo();
  write(path.join(dir, 'package.json'), JSON.stringify({ name: 'no-test', scripts: { build: 'tsc' } }));
  write(path.join(dir, 'package-lock.json'), '{}');
  const facts = scanRepo(dir);
  const md = generateAgentsMd(facts);
  assert.equal(md.includes('npm test'), false);
  assert.equal(md.includes('npm run build'), true);
});

test('doctor detects missing AGENTS.md', () => {
  const report = doctor(expressRoot);
  assert.equal(report.checks.some(c => c.code === 'AGENTS.md_MISSING'), true);
});

test('doctor detects stale npm command in pnpm repo', () => {
  const dir = tempRepo();
  write(path.join(dir, 'package.json'), JSON.stringify({ name: 'pnpm-repo', packageManager: 'pnpm@9.0.0', scripts: { build: 'next build' }, dependencies: { next: '^15.0.0' } }));
  write(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
  write(path.join(dir, 'AGENTS.md'), 'Run npm run test before finishing.');
  const report = doctor(dir);
  assert.equal(report.checks.some(c => c.code === 'STALE_COMMAND'), true);
  assert.equal(report.checks.some(c => c.code === 'PACKAGE_MANAGER_MISMATCH'), true);
});

test('secret scanner detects OPENAI_API_KEY', () => {
  assert.deepEqual(detectSecretsInText('OPENAI_API_KEY=sk-testsecretvalue12345'), ['OPENAI_API_KEY', 'OPENAI_STYLE_KEY']);
});

test('pack ranks auth files for add login', () => {
  const facts = scanRepo(nextRoot);
  const ranked = rankTaskFiles(facts, 'add login with Google OAuth');
  assert.equal(ranked.some(f => f.path.includes('auth')), true);
});

test('pack ranks Stripe webhook files for fix Stripe webhook', () => {
  const facts = scanRepo(nextRoot);
  const ranked = rankTaskFiles(facts, 'fix Stripe webhook bug');
  assert.equal(ranked.some(f => f.path.includes('stripe/webhook')), true);
});

test('generateContextFiles dry-run creates expected outputs without writing', () => {
  const dir = tempRepo();
  write(path.join(dir, 'package.json'), JSON.stringify({ name: 'dry', scripts: { test: 'node --test' }, dependencies: { express: '^5.0.0' } }));
  write(path.join(dir, 'package-lock.json'), '{}');
  const result = generateContextFiles(dir, { target: 'agents,claude', dryRun: true });
  assert.equal(result.results.length, 2);
  assert.equal(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
});

test('writeRepoMap creates JSON and Markdown files', () => {
  const dir = tempRepo();
  write(path.join(dir, 'package.json'), JSON.stringify({ name: 'mapme', scripts: { test: 'node --test' } }));
  write(path.join(dir, 'package-lock.json'), '{}');
  writeRepoMap(dir);
  assert.equal(fs.existsSync(path.join(dir, '.repoctx/repo-map.json')), true);
  assert.equal(fs.existsSync(path.join(dir, '.repoctx/repo-map.md')), true);
});

test('createTaskPack writes a markdown pack', () => {
  const dir = tempRepo();
  write(path.join(dir, 'package.json'), JSON.stringify({ name: 'packme', scripts: { test: 'node --test' }, dependencies: { express: '^5.0.0' } }));
  write(path.join(dir, 'package-lock.json'), '{}');
  write(path.join(dir, 'src/routes/users.ts'), 'export const users = [];');
  const pack = createTaskPack(dir, 'add user route');
  assert.equal(fs.existsSync(path.join(dir, pack.path)), true);
  assert.equal(pack.content.includes('Likely relevant files'), true);
});
