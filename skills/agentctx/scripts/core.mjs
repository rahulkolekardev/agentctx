import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const VERSION = '0.1.0';

export const DEFAULT_IGNORE = [
  '.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.svelte-kit', '.astro',
  '.vercel', '.netlify', 'coverage', '.cache', '.tmp', '.repoctx/packs', '.DS_Store',
  '.env', '.env.*', '*.pem', '*.key', 'id_rsa', 'id_ed25519'
];

export const CONTEXT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
  '.cursor/rules/project.mdc',
  'llms.txt'
];

const FRAMEWORK_PRIORITY = [
  'nextjs', 'sveltekit', 'astro', 'nestjs', 'express', 'fastify', 'vite', 'react', 'unknown'
];

export function normalizeSlash(value) {
  return value.split(path.sep).join('/');
}

export function pathExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

export function readJson(filePath) {
  try {
    return JSON.parse(readText(filePath));
  } catch {
    return undefined;
  }
}

export function detectRepoRoot(start = process.cwd()) {
  let current = path.resolve(start);
  const markers = ['.git', 'package.json', 'pnpm-workspace.yaml', 'turbo.json', 'nx.json'];
  while (true) {
    if (markers.some(marker => pathExists(path.join(current, marker)))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const withoutPrefix = token.slice(2);
    if (withoutPrefix.includes('=')) {
      const [key, ...rest] = withoutPrefix.split('=');
      args[key] = rest.join('=');
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[withoutPrefix] = next;
      i++;
    } else {
      args[withoutPrefix] = true;
    }
  }
  return args;
}

export function color(text, kind = 'reset', noColor = false) {
  if (noColor || process.env.NO_COLOR) return text;
  const codes = {
    reset: ['\x1b[0m', '\x1b[0m'],
    bold: ['\x1b[1m', '\x1b[22m'],
    green: ['\x1b[32m', '\x1b[39m'],
    yellow: ['\x1b[33m', '\x1b[39m'],
    red: ['\x1b[31m', '\x1b[39m']
  };
  const pair = codes[kind] ?? codes.reset;
  return `${pair[0]}${text}${pair[1]}`;
}

export function symbol(level) {
  return level === 'critical' || level === 'error' ? '❌' : level === 'warning' ? '⚠️' : '✅';
}

function gitignorePatterns(root) {
  const file = path.join(root, '.gitignore');
  if (!pathExists(file)) return [];
  return readText(file)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function patternMatches(rel, pattern) {
  const p = pattern.replace(/^\//, '').replace(/\/$/, '');
  if (!p) return false;
  if (p.includes('*')) {
    const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`(^|/)${escaped}($|/)`).test(rel);
  }
  return rel === p || rel.startsWith(`${p}/`) || rel.endsWith(`/${p}`);
}

export function shouldIgnore(rel, patterns) {
  const normalized = normalizeSlash(rel);
  return patterns.some(pattern => patternMatches(normalized, pattern));
}

export function walkFiles(root, options = {}) {
  const maxFiles = options.maxFiles ?? 5000;
  const patterns = [...DEFAULT_IGNORE, ...gitignorePatterns(root), ...(options.ignore ?? [])];
  const files = [];

  function walk(absDir) {
    if (files.length >= maxFiles) return;
    let entries = [];
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(absDir, entry.name);
      const rel = normalizeSlash(path.relative(root, abs));
      if (!rel || shouldIgnore(rel, patterns)) continue;
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile()) files.push(rel);
      if (files.length >= maxFiles) return;
    }
  }

  walk(root);
  return files.sort();
}

function depsOf(pkg) {
  return { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies };
}

function hasDep(deps, name) {
  return Object.prototype.hasOwnProperty.call(deps, name);
}

function evidence(value, evidenceList = [], confidence = 'medium') {
  return { value, evidence: evidenceList, confidence };
}

function label(value) {
  if (!value || value === 'unknown') return 'unknown';
  const labels = {
    nextjs: 'Next.js', react: 'React', vite: 'Vite', express: 'Express', nestjs: 'NestJS',
    fastify: 'Fastify', sveltekit: 'SvelteKit', astro: 'Astro', pnpm: 'pnpm', npm: 'npm',
    yarn: 'Yarn', bun: 'Bun', vitest: 'Vitest', jest: 'Jest', playwright: 'Playwright',
    cypress: 'Cypress', 'node-test': 'node:test', eslint: 'ESLint', biome: 'Biome', prettier: 'Prettier', rome: 'Rome'
  };
  return labels[value] ?? String(value);
}

export function detectPackageManager(root, pkg = {}) {
  const signals = [];
  const risks = [];
  const packageManager = typeof pkg.packageManager === 'string' ? pkg.packageManager.split('@')[0] : undefined;
  if (packageManager) signals.push({ value: packageManager, evidence: [`package.json packageManager: ${pkg.packageManager}`], strength: 100 });
  if (pathExists(path.join(root, 'pnpm-lock.yaml'))) signals.push({ value: 'pnpm', evidence: ['pnpm-lock.yaml'], strength: 80 });
  if (pathExists(path.join(root, 'bun.lock')) || pathExists(path.join(root, 'bun.lockb'))) signals.push({ value: 'bun', evidence: ['bun.lock or bun.lockb'], strength: 70 });
  if (pathExists(path.join(root, 'yarn.lock'))) signals.push({ value: 'yarn', evidence: ['yarn.lock'], strength: 60 });
  if (pathExists(path.join(root, 'package-lock.json'))) signals.push({ value: 'npm', evidence: ['package-lock.json'], strength: 50 });
  if (!signals.length) return { result: evidence('unknown', [], 'low'), risks };
  signals.sort((a, b) => b.strength - a.strength);
  const chosen = signals[0];
  const values = new Set(signals.map(s => s.value));
  if (values.size > 1) {
    risks.push({ level: 'warning', code: 'PACKAGE_MANAGER_CONFLICT', message: `Multiple package manager signals found. Using ${chosen.value}.`, evidence: signals.flatMap(s => s.evidence), suggestion: 'Remove stale lockfiles or update package.json packageManager.' });
  }
  return { result: evidence(chosen.value, chosen.evidence, 'high'), risks };
}

export function detectFramework(root, pkg = {}, files = []) {
  const deps = depsOf(pkg);
  const candidates = [];
  const add = (value, ev, strength = 50) => candidates.push({ value, evidence: [ev], strength });
  if (hasDep(deps, 'next') || files.some(f => /^next\.config\./.test(path.basename(f)))) add('nextjs', 'next dependency or next.config.*', 100);
  if (hasDep(deps, '@sveltejs/kit')) add('sveltekit', '@sveltejs/kit dependency', 95);
  if (hasDep(deps, 'astro')) add('astro', 'astro dependency', 90);
  if (hasDep(deps, '@nestjs/core')) add('nestjs', '@nestjs/core dependency', 85);
  if (hasDep(deps, 'express')) add('express', 'express dependency', 75);
  if (hasDep(deps, 'fastify')) add('fastify', 'fastify dependency', 70);
  if (hasDep(deps, 'vite')) add('vite', 'vite dependency', 60);
  if (hasDep(deps, 'react')) add('react', 'react dependency', 50);
  if (!candidates.length) return evidence('unknown', [], 'low');
  candidates.sort((a, b) => b.strength - a.strength || FRAMEWORK_PRIORITY.indexOf(a.value) - FRAMEWORK_PRIORITY.indexOf(b.value));
  const c = candidates[0];
  return evidence(c.value, c.evidence, 'high');
}

export function detectLanguage(root, files = []) {
  const ts = pathExists(path.join(root, 'tsconfig.json')) || files.some(f => /\.(ts|tsx)$/.test(f));
  const js = files.some(f => /\.(js|jsx|mjs|cjs)$/.test(f));
  const ev = [];
  if (pathExists(path.join(root, 'tsconfig.json'))) ev.push('tsconfig.json');
  if (files.some(f => /\.(ts|tsx)$/.test(f))) ev.push('TypeScript source files');
  if (js) ev.push('JavaScript source files');
  return { typescript: ts, javascript: js, evidence: ev };
}

export function detectTestRunner(root, pkg = {}, files = []) {
  const deps = depsOf(pkg);
  const scripts = pkg.scripts ?? {};
  if (hasDep(deps, 'vitest') || files.some(f => /^vitest\.config\./.test(path.basename(f)))) return evidence('vitest', ['vitest dependency or config'], 'high');
  if (hasDep(deps, 'jest') || files.some(f => /^jest\.config\./.test(path.basename(f)))) return evidence('jest', ['jest dependency or config'], 'high');
  if (hasDep(deps, '@playwright/test') || files.some(f => /^playwright\.config\./.test(path.basename(f)))) return evidence('playwright', ['Playwright dependency or config'], 'high');
  if (hasDep(deps, 'cypress') || files.some(f => /^cypress\.config\./.test(path.basename(f)))) return evidence('cypress', ['Cypress dependency or config'], 'high');
  if (Object.values(scripts).some(v => String(v).includes('node --test')) || files.some(f => f.endsWith('.test.js') || f.endsWith('.test.mjs'))) return evidence('node-test', ['node --test script or test files'], 'medium');
  return evidence('unknown', [], 'low');
}

export function detectLinter(root, pkg = {}, files = []) {
  const deps = depsOf(pkg);
  if (hasDep(deps, 'eslint') || files.some(f => /^eslint\.config\./.test(path.basename(f)) || /^\.eslintrc/.test(path.basename(f)))) return evidence('eslint', ['ESLint dependency or config'], 'high');
  if (hasDep(deps, '@biomejs/biome') || files.includes('biome.json')) return evidence('biome', ['Biome dependency or biome.json'], 'high');
  if (hasDep(deps, 'prettier') || files.some(f => /^\.prettierrc/.test(path.basename(f)))) return evidence('prettier', ['Prettier dependency or config'], 'medium');
  if (hasDep(deps, 'rome') || files.includes('rome.json')) return evidence('rome', ['Rome dependency or config'], 'medium');
  return evidence('unknown', [], 'low');
}

export function detectMonorepo(root, pkg = {}) {
  const ev = [];
  if (pathExists(path.join(root, 'pnpm-workspace.yaml'))) ev.push('pnpm-workspace.yaml');
  if (pathExists(path.join(root, 'turbo.json'))) ev.push('turbo.json');
  if (pathExists(path.join(root, 'nx.json'))) ev.push('nx.json');
  if (pkg.workspaces) ev.push('package.json workspaces');
  return evidence(ev.length > 0, ev, ev.length ? 'high' : 'medium');
}

export function detectDatabase(root, pkg = {}, files = []) {
  const deps = depsOf(pkg);
  if (files.includes('prisma/schema.prisma') || hasDep(deps, 'prisma') || hasDep(deps, '@prisma/client')) return evidence('prisma', ['Prisma schema or dependency'], 'high');
  if (files.some(f => /^drizzle\.config\./.test(path.basename(f))) || hasDep(deps, 'drizzle-orm')) return evidence('drizzle', ['Drizzle config or dependency'], 'high');
  if (hasDep(deps, 'mongoose')) return evidence('mongoose', ['mongoose dependency'], 'high');
  if (hasDep(deps, 'typeorm')) return evidence('typeorm', ['typeorm dependency'], 'high');
  if (hasDep(deps, 'sequelize')) return evidence('sequelize', ['sequelize dependency'], 'medium');
  if (hasDep(deps, 'knex')) return evidence('knex', ['knex dependency'], 'medium');
  return undefined;
}

export function detectCi(root, files = []) {
  const ev = [];
  if (files.some(f => /^\.github\/workflows\/.+\.ya?ml$/.test(f))) ev.push('.github/workflows/*.yml');
  if (files.includes('.gitlab-ci.yml')) ev.push('.gitlab-ci.yml');
  if (files.includes('circle.yml')) ev.push('circle.yml');
  return evidence(ev.length > 0, ev, ev.length ? 'high' : 'medium');
}

export function buildCommands(packageManager, scripts = {}) {
  const pm = packageManager === 'unknown' ? 'npm' : packageManager;
  const run = script => {
    if (pm === 'npm') return script === 'test' ? 'npm test' : `npm run ${script}`;
    if (pm === 'bun') return script === 'test' ? 'bun test' : `bun run ${script}`;
    return `${pm} ${script}`;
  };
  const commands = {};
  if (pm === 'npm') commands.install = 'npm install';
  if (pm === 'pnpm') commands.install = 'pnpm install';
  if (pm === 'yarn') commands.install = 'yarn install';
  if (pm === 'bun') commands.install = 'bun install';
  for (const key of ['dev', 'build', 'test', 'lint', 'format', 'typecheck']) {
    if (scripts[key]) commands[key] = run(key);
  }
  return commands;
}

export function rankImportantFiles(files) {
  const rules = [
    ['package.json', 'Project manifest and scripts', 100], ['pnpm-lock.yaml', 'pnpm lockfile', 90], ['package-lock.json', 'npm lockfile', 85], ['yarn.lock', 'Yarn lockfile', 85], ['bun.lock', 'Bun lockfile', 85], ['tsconfig.json', 'TypeScript configuration', 80], ['README.md', 'Project documentation', 75], ['next.config.ts', 'Next.js configuration', 70], ['next.config.js', 'Next.js configuration', 70], ['vite.config.ts', 'Vite configuration', 65], ['vite.config.js', 'Vite configuration', 65], ['prisma/schema.prisma', 'Database schema', 70], ['src/index.ts', 'Application entrypoint', 65], ['src/main.ts', 'Application entrypoint', 65], ['app/page.tsx', 'Next.js app route entry', 65], ['app/layout.tsx', 'Next.js app layout', 60], ['middleware.ts', 'Middleware entrypoint', 55]
  ];
  const result = [];
  for (const [file, reason, score] of rules) if (files.includes(file)) result.push({ path: file, reason, score });
  for (const file of files) {
    if (/app\/api\/.+\/route\.(ts|js)$/.test(file)) result.push({ path: file, reason: 'API route', score: 50 });
    if (/src\/(routes|controllers|services)\//.test(file)) result.push({ path: file, reason: 'Backend route/controller/service', score: 45 });
  }
  const seen = new Set();
  return result.filter(item => { if (seen.has(item.path)) return false; seen.add(item.path); return true; }).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, 20);
}

export function scanRepo(rootInput = process.cwd()) {
  const root = detectRepoRoot(rootInput);
  const files = walkFiles(root);
  const pkgPath = path.join(root, 'package.json');
  const pkg = pathExists(pkgPath) ? readJson(pkgPath) ?? {} : {};
  const risks = [];
  if (!pathExists(pkgPath)) risks.push({ level: 'warning', code: 'NO_PACKAGE_JSON', message: 'No package.json found.', suggestion: 'Run AgentCtx from a Node.js project root.' });
  const pm = detectPackageManager(root, pkg);
  risks.push(...pm.risks);
  const framework = detectFramework(root, pkg, files);
  const language = detectLanguage(root, files);
  const testRunner = detectTestRunner(root, pkg, files);
  const linter = detectLinter(root, pkg, files);
  const monorepo = detectMonorepo(root, pkg);
  const database = detectDatabase(root, pkg, files);
  const ci = detectCi(root, files);
  const scripts = pkg.scripts ?? {};
  const commands = buildCommands(pm.result.value, scripts);
  const importantFiles = rankImportantFiles(files);
  if (!commands.test) risks.push({ level: 'warning', code: 'NO_TEST_SCRIPT', message: 'No test script found in package.json.', suggestion: 'Add a test script or omit test instructions.' });
  if (!commands.build) risks.push({ level: 'warning', code: 'NO_BUILD_SCRIPT', message: 'No build script found in package.json.' });
  if (!commands.lint) risks.push({ level: 'warning', code: 'NO_LINT_SCRIPT', message: 'No lint script found in package.json.' });
  return { root, name: pkg.name ?? path.basename(root), packageJsonPath: pathExists(pkgPath) ? pkgPath : undefined, packageManager: pm.result, framework, language, testRunner, linter, monorepo, database, ci, scripts, commands, importantFiles, risks, fileCount: files.length };
}

function languageLabel(language) { if (language.typescript && language.javascript) return 'TypeScript and JavaScript'; if (language.typescript) return 'TypeScript'; if (language.javascript) return 'JavaScript'; return 'unknown language'; }
function summary(facts) { const framework = label(facts.framework.value); const language = languageLabel(facts.language); const pm = label(facts.packageManager.value); const db = facts.database ? ` with ${label(facts.database.value)} database tooling` : ''; return `${facts.name} is a ${framework} project using ${language} and ${pm}${db}.`; }
function bullet(items, fallback = '- Not detected.') { return items && items.length ? items.map(item => `- ${item}`).join('\n') : fallback; }
function commandList(commands) { const entries = Object.entries(commands).filter(([key]) => key !== 'install'); const lines = []; if (commands.install) lines.push(`- Install: \`${commands.install}\``); for (const [key, value] of entries) lines.push(`- ${key[0].toUpperCase()}${key.slice(1)}: \`${value}\``); return lines.length ? lines.join('\n') : '- No package scripts detected.'; }
function verificationList(commands) { const keys = ['lint', 'test', 'typecheck', 'build']; const lines = keys.filter(k => commands[k]).map(k => `- \`${commands[k]}\``); return lines.length ? lines.join('\n') : '- No verification commands detected. Ask the maintainer before inventing commands.'; }
function evidenceList(facts) { const ev = [...facts.packageManager.evidence, ...facts.framework.evidence, ...facts.language.evidence, ...facts.testRunner.evidence, ...facts.linter.evidence, ...facts.ci.evidence, ...(facts.database?.evidence ?? [])]; return bullet([...new Set(ev)], '- No strong evidence detected.'); }
function importantFilesList(facts) { return facts.importantFiles.length ? facts.importantFiles.slice(0, 10).map(f => `- \`${f.path}\` — ${f.reason}`).join('\n') : '- No important files detected.'; }
function architectureNotes(facts) { const notes = []; const fw = facts.framework.value; if (fw === 'nextjs') notes.push('- Next.js routes and pages may live in `app/` or `pages/`. API handlers often live under `app/api/**/route.ts`.'); if (fw === 'express') notes.push('- Express applications often organize HTTP routes under `src/routes/` and app startup in `src/index.ts`.'); if (fw === 'nestjs') notes.push('- NestJS applications use modules, controllers, and providers. Prefer existing module boundaries.'); if (facts.database?.value === 'prisma') notes.push('- Prisma schema is usually in `prisma/schema.prisma`; avoid editing migrations blindly.'); if (facts.monorepo.value) notes.push('- This appears to be a monorepo. Prefer package-local commands and avoid cross-package changes unless required.'); return notes.length ? notes.join('\n') : '- Follow nearby file patterns and existing folder conventions.'; }

export function generateAgentsMd(facts) { return `# AGENTS.md\n\nGenerated by AgentCtx. Keep this file short and evidence-backed.\n\n## Project overview\n\n${summary(facts)}\n\nDetected evidence:\n${evidenceList(facts)}\n\n## Commands\n\n${commandList(facts.commands)}\n\n## Working guidelines\n\n- Make minimal, focused changes.\n- Follow existing patterns in nearby files.\n- Do not add new runtime dependencies unless necessary.\n- Do not edit generated files unless requested.\n- Do not read, print, or modify secret files such as \`.env\`.\n- Do not invent commands. Use only commands listed here or detected in \`package.json\`.\n\n## Verification\n\nBefore finishing, run the relevant available commands:\n\n${verificationList(facts.commands)}\n\n## Important files\n\n${importantFilesList(facts)}\n`; }
export function generateClaudeMd(facts) { return `# CLAUDE.md\n\nThis file provides project guidance for Claude Code. Generated by AgentCtx.\n\n## Repository summary\n\n${summary(facts)}\n\n## Development commands\n\n${commandList(facts.commands)}\n\n## Architecture notes\n\n${architectureNotes(facts)}\n\n## Working rules\n\n- Prefer small, reviewable edits.\n- Reuse existing utilities and patterns.\n- Update or add tests when behavior changes.\n- Avoid changing public APIs unless explicitly requested.\n- Never expose secrets or \`.env\` values.\n\n## Verification checklist\n\n${verificationList(facts.commands)}\n`; }
export function generateGeminiMd(facts) { return `# GEMINI.md

This file provides project context for Gemini CLI and Gemini-based coding workflows. Generated by AgentCtx.

## Repository summary

${summary(facts)}

## Development commands

${commandList(facts.commands)}

## Architecture notes

${architectureNotes(facts)}

## Working rules

- Make minimal, reviewable edits.
- Prefer existing project patterns and nearby code.
- Use the commands detected in this file; do not invent scripts.
- Do not read, print, or modify secret files such as \`.env\`.
- Do not expose API keys, tokens, credentials, or private keys.

## Verification checklist

${verificationList(facts.commands)}
`; }
export function generateCopilotInstructions(facts) { return `# GitHub Copilot instructions\n\nThis repository uses ${label(facts.packageManager.value)} and ${label(facts.framework.value)}.\n\nWhen suggesting changes:\n\n- Follow existing project conventions.\n- Prefer TypeScript-safe patterns where applicable.\n- Keep changes minimal and reviewable.\n- Use existing utilities before adding new dependencies.\n- Suggest relevant verification commands after code changes.\n- Never expose secrets or \`.env\` values.\n\nCommon commands:\n\n${commandList(facts.commands)}\n`; }
export function generateCursorRules(facts) { return `---\ndescription: Project-wide AI coding rules for this repository\nalwaysApply: true\n---\n\n# Project rules\n\nThis is a ${label(facts.framework.value)} project using ${label(facts.packageManager.value)}.\n\nUse existing code style and nearby implementation patterns.\n\n## Commands\n\n${commandList(facts.commands)}\n\n## Rules\n\n- Make focused edits.\n- Do not introduce unnecessary dependencies.\n- Do not expose secrets.\n- Verify changes with available commands.\n`; }
export function generateLlmsTxt(facts) { return `# ${facts.name}\n\n${summary(facts)}\n\n## Repository guidance\n\n- Use AGENTS.md for general AI coding agent instructions.\n- Use CLAUDE.md for Claude Code guidance.\n- Use GEMINI.md for Gemini CLI and Gemini-based coding workflows.\n- Use .github/copilot-instructions.md for GitHub Copilot instructions.\n- Use AGENTS.md, repo maps, and task packs for agent-first IDEs and CLIs such as Google Antigravity, Windsurf, Amp, Aider, Cline, Roo Code, Continue, OpenHands, Replit Agent, and other coding agents.\n- Do not include secrets or .env values in AI context.\n\n## Important files\n\n${importantFilesList(facts)}\n`; }

export function repoMapObject(facts) { const dirs = new Map(); for (const file of walkFiles(facts.root)) { const top = file.split('/')[0]; if (!top) continue; dirs.set(top, (dirs.get(top) ?? 0) + 1); } return { generatedAt: new Date().toISOString(), root: facts.root, name: facts.name, summary: summary(facts), facts, importantFiles: facts.importantFiles, directories: [...dirs.entries()].sort((a, b) => b[1] - a[1]).map(([name, fileCount]) => ({ name, fileCount })), commands: facts.commands, risks: facts.risks }; }
export function generateRepoMapMarkdown(facts) { const map = repoMapObject(facts); const dirs = map.directories.slice(0, 20).map(d => `- \`${d.name}/\` — ${d.fileCount} files`).join('\n') || '- No directories detected.'; const risks = facts.risks.length ? facts.risks.map(r => `- ${r.level.toUpperCase()}: ${r.message}`).join('\n') : '- No risks detected.'; return `# Repo Map: ${facts.name}\n\nGenerated by AgentCtx on ${map.generatedAt}.\n\n## Summary\n\n${map.summary}\n\n## Commands\n\n${commandList(facts.commands)}\n\n## Important files\n\n${importantFilesList(facts)}\n\n## Top directories\n\n${dirs}\n\n## Risks and warnings\n\n${risks}\n`; }
export function targetFilesFor(targetsText = 'agents,claude,gemini,copilot,cursor') { const targets = new Set(String(targetsText).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)); if (targets.has('all')) for (const t of ['agents', 'codex', 'claude', 'gemini', 'gemini-cli', 'copilot', 'cursor', 'llms']) targets.add(t); const output = []; if (targets.has('agents') || targets.has('codex') || targets.has('antigravity') || targets.has('amp') || targets.has('aider') || targets.has('windsurf') || targets.has('cline') || targets.has('roo') || targets.has('continue') || targets.has('openhands') || targets.has('replit')) output.push(['AGENTS.md', generateAgentsMd]); if (targets.has('claude')) output.push(['CLAUDE.md', generateClaudeMd]); if (targets.has('gemini') || targets.has('gemini-cli')) output.push(['GEMINI.md', generateGeminiMd]); if (targets.has('copilot')) output.push(['.github/copilot-instructions.md', generateCopilotInstructions]); if (targets.has('cursor')) output.push(['.cursor/rules/project.mdc', generateCursorRules]); if (targets.has('llms')) output.push(['llms.txt', generateLlmsTxt]); return output; }
export function generateContextFiles(rootInput = process.cwd(), options = {}) { const facts = scanRepo(rootInput); const outputs = targetFilesFor(options.target ?? (options.all ? 'all' : 'agents,claude,gemini,copilot,cursor')); const results = []; for (const [rel, generator] of outputs) { const abs = path.join(facts.root, rel); const content = generator(facts).trimEnd() + os.EOL; if (options.dryRun) { results.push({ status: 'dry-run', path: rel, content }); continue; } if (pathExists(abs) && !options.force) { results.push({ status: 'skipped', path: rel, reason: 'already exists' }); continue; } writeText(abs, content); results.push({ status: 'created', path: rel }); } return { facts, results }; }
export function writeRepoMap(rootInput = process.cwd(), options = {}) { const facts = scanRepo(rootInput); const map = repoMapObject(facts); const jsonText = JSON.stringify(map, null, 2) + os.EOL; const mdText = generateRepoMapMarkdown(facts).trimEnd() + os.EOL; if (!options.stdout) { writeText(path.join(facts.root, '.repoctx/repo-map.json'), jsonText); writeText(path.join(facts.root, '.repoctx/repo-map.md'), mdText); } return { facts, jsonText, mdText }; }

export function detectSecretsInText(text) { const patterns = [['OPENAI_API_KEY', /OPENAI_API_KEY\s*=\s*[^\s]+/i], ['ANTHROPIC_API_KEY', /ANTHROPIC_API_KEY\s*=\s*[^\s]+/i], ['GITHUB_TOKEN', /GITHUB_TOKEN\s*=\s*[^\s]+/i], ['AWS_ACCESS_KEY_ID', /AWS_ACCESS_KEY_ID\s*=\s*[^\s]+/i], ['AWS_SECRET_ACCESS_KEY', /AWS_SECRET_ACCESS_KEY\s*=\s*[^\s]+/i], ['PRIVATE_KEY', /-----BEGIN (RSA )?PRIVATE KEY-----/], ['OPENAI_STYLE_KEY', /\bsk-[A-Za-z0-9_-]{16,}\b/], ['SLACK_BOT_TOKEN', /\bxoxb-[A-Za-z0-9-]{16,}\b/], ['GITHUB_PAT', /\bgithub_pat_[A-Za-z0-9_]{16,}\b/], ['GITHUB_TOKEN_PREFIX', /\bgh[pousr]_[A-Za-z0-9_]{16,}\b/]]; return patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name); }
function words(text) { return text.trim().split(/\s+/).filter(Boolean).length; }
function checkStaleCommands(text, facts, rel) { const issues = []; const hasScript = key => Boolean(facts.scripts?.[key]); const pm = facts.packageManager.value; const staleTests = [['npm test', 'test'], ['npm run test', 'test'], ['pnpm test', 'test'], ['yarn test', 'test'], ['bun test', 'test'], ['npm run build', 'build'], ['pnpm build', 'build'], ['yarn build', 'build'], ['bun run build', 'build'], ['npm run lint', 'lint'], ['pnpm lint', 'lint'], ['yarn lint', 'lint'], ['bun run lint', 'lint']]; for (const [cmd, script] of staleTests) if (text.includes(cmd) && !hasScript(script)) issues.push({ level: 'warning', code: 'STALE_COMMAND', message: `${rel} mentions \`${cmd}\`, but package.json has no ${script} script.`, suggestion: 'Regenerate context or update the instruction file.' }); for (const manager of ['npm', 'pnpm', 'yarn', 'bun']) if (manager !== pm && pm !== 'unknown' && new RegExp(`\\b${manager}\\s+(install|run|test|build|lint|dev)\\b`).test(text)) issues.push({ level: 'warning', code: 'PACKAGE_MANAGER_MISMATCH', message: `${rel} mentions ${manager}, but detected package manager is ${pm}.`, suggestion: `Use ${pm} commands or confirm package manager.` }); return issues; }
export function doctor(rootInput = process.cwd()) { const facts = scanRepo(rootInput); const checks = []; const add = (level, code, message, suggestion, evidence = []) => checks.push({ level, code, message, suggestion, evidence }); for (const rel of CONTEXT_FILES) { const abs = path.join(facts.root, rel); if (pathExists(abs)) add('info', `${rel}_EXISTS`, `${rel} exists.`); else add('warning', `${rel}_MISSING`, `${rel} is missing.`, `Run generate with target for ${rel}.`); } for (const rel of CONTEXT_FILES) { const abs = path.join(facts.root, rel); if (!pathExists(abs)) continue; const content = readText(abs); const byteSize = Buffer.byteLength(content, 'utf8'); const wordCount = words(content); if (wordCount > 1500) add('warning', 'CONTEXT_TOO_LONG', `${rel} has ${wordCount} words. Keep context files short.`, 'Regenerate or trim generic guidance.', [rel]); if (byteSize > 32768) add('warning', 'CONTEXT_OVER_32KIB', `${rel} is over 32 KiB.`, 'Trim content; some agents have context-file limits.', [rel]); if (byteSize > 65536) add('error', 'CONTEXT_OVER_64KIB', `${rel} is over 64 KiB.`, 'Split or heavily trim the file.', [rel]); for (const name of detectSecretsInText(content)) add('critical', 'POSSIBLE_SECRET', `${rel} contains possible secret pattern: ${name}.`, 'Remove the secret immediately and rotate it if real.', [rel]); checks.push(...checkStaleCommands(content, facts, rel)); } if (!pathExists(path.join(facts.root, 'README.md'))) add('warning', 'NO_README', 'README.md is missing.', 'Add a README to help humans and agents understand the project.'); if (!['LICENSE', 'LICENSE.md', 'LICENSE.txt'].some(f => pathExists(path.join(facts.root, f)))) add('warning', 'NO_LICENSE', 'LICENSE file is missing.', 'Add a license for open-source clarity.'); if (!facts.ci.value) add('warning', 'NO_CI', 'No CI workflow detected.', 'Add a CI workflow to validate agent-made changes.'); if (!facts.commands.build) add('warning', 'NO_BUILD_SCRIPT', 'No build script detected.', 'Add a build script if the project needs build validation.'); if (!facts.commands.test) add('warning', 'NO_TEST_SCRIPT', 'No test script detected.', 'Add a test script or avoid test instructions.'); if (!facts.commands.lint) add('warning', 'NO_LINT_SCRIPT', 'No lint script detected.', 'Add a lint script if code style validation is expected.'); if (facts.risks.some(r => r.code === 'PACKAGE_MANAGER_CONFLICT')) add('error', 'PACKAGE_MANAGER_CONFLICT', 'Package manager conflict detected.', 'Remove stale lockfiles or set package.json packageManager.'); let score = 100; const exists = rel => pathExists(path.join(facts.root, rel)); if (!exists('AGENTS.md')) score -= 15; if (!exists('CLAUDE.md')) score -= 10; if (!exists('GEMINI.md')) score -= 4; if (!exists('.github/copilot-instructions.md')) score -= 8; if (!exists('.cursor/rules/project.mdc')) score -= 5; if (!pathExists(path.join(facts.root, 'README.md'))) score -= 10; if (!['LICENSE', 'LICENSE.md', 'LICENSE.txt'].some(f => pathExists(path.join(facts.root, f)))) score -= 5; if (!facts.ci.value) score -= 8; if (!facts.commands.build) score -= 10; if (!facts.commands.test) score -= 10; if (!facts.commands.lint) score -= 8; if (checks.some(c => c.code === 'STALE_COMMAND')) score -= 15; if (checks.some(c => c.code === 'PACKAGE_MANAGER_CONFLICT')) score -= 25; if (checks.some(c => c.code === 'POSSIBLE_SECRET')) score -= 40; if (checks.some(c => c.code === 'CONTEXT_TOO_LONG' || c.code === 'CONTEXT_OVER_32KIB')) score -= 10; score = Math.max(0, Math.min(100, score)); return { facts, score, checks }; }

export function slugify(text) { return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'task'; }
function taskKeywords(task) { const raw = String(task).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); const stop = new Set(['add', 'fix', 'the', 'a', 'an', 'with', 'to', 'from', 'for', 'and', 'or', 'in', 'on', 'of']); const keywords = raw.filter(w => !stop.has(w)); const synonyms = { login: ['auth', 'user', 'session', 'oauth'], auth: ['login', 'user', 'session', 'oauth'], stripe: ['payment', 'subscription', 'checkout', 'webhook'], payment: ['stripe', 'checkout', 'webhook', 'subscription'], webhook: ['stripe', 'api', 'route'], database: ['prisma', 'schema', 'model'], user: ['auth', 'account', 'profile'], test: ['spec', 'test', '__tests__'] }; const expanded = new Set(keywords); for (const k of keywords) for (const s of synonyms[k] ?? []) expanded.add(s); return [...expanded]; }
function candidateFiles(root) { const files = walkFiles(root, { maxFiles: 3000 }); return files.filter(f => /^(package\.json|tsconfig\.json|README\.md|src\/|app\/|pages\/|components\/|lib\/|server\/|routes\/|controllers\/|services\/|prisma\/schema\.prisma|drizzle\.config\.|middleware\.|next\.config\.|vite\.config\.)/.test(f) && !/\.(png|jpg|jpeg|gif|webp|svg|ico|lock)$/.test(f)); }
export function rankTaskFiles(facts, task) { const keywords = taskKeywords(task); const taskLower = String(task).toLowerCase(); const files = candidateFiles(facts.root); const scored = []; for (const file of files) { const lower = file.toLowerCase(); const parts = lower.split('/'); let score = 0; const reasons = []; for (const kw of keywords) { if (path.basename(lower).includes(kw)) { score += 20; reasons.push(`filename matches "${kw}"`); } if (parts.slice(0, -1).some(part => part.includes(kw))) { score += 15; reasons.push(`directory matches "${kw}"`); } } if (/^(app\/page|app\/layout|src\/index|src\/main|middleware\.)/.test(lower)) { score += 15; reasons.push('framework entrypoint'); } if (/^(package\.json|tsconfig\.json|next\.config\.|vite\.config\.|README\.md)/.test(lower)) { score += 10; reasons.push('important config/documentation'); } if (facts.database?.value && file === 'prisma/schema.prisma' && /(auth|user|payment|subscription|order|product|database|db|model)/.test(taskLower)) { score += 10; reasons.push('database schema likely relevant'); } if (/app\/api\/.+\/route\.(ts|js)$/.test(lower) && /(api|auth|login|payment|webhook|stripe)/.test(taskLower)) { score += 10; reasons.push('API route likely relevant'); } if (/src\/(services|controllers|routes)\//.test(lower) && /(api|service|controller|route|backend|user|auth|payment)/.test(taskLower)) { score += 8; reasons.push('backend route/controller/service'); } if (file === 'README.md' || file === 'package.json') { score += 5; reasons.push('baseline project context'); } if (score > 0) scored.push({ path: file, reason: [...new Set(reasons)].join('; '), score }); } return scored.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, 15); }
export function createTaskPack(rootInput, task, options = {}) { const facts = scanRepo(rootInput); const ranked = rankTaskFiles(facts, task); const filesText = ranked.length ? ranked.map(f => `- \`${f.path}\` — ${f.reason} (score ${f.score})`).join('\n') : '- No high-confidence files found. Start from README.md and package.json if present.'; const patterns = architectureNotes(facts); const content = `# Task Context Pack\n\nGenerated by AgentCtx.\n\n## Task\n\n${task}\n\n## Repository summary\n\n${summary(facts)}\n\n## Likely relevant files\n\n${filesText}\n\n## Relevant commands\n\n${commandList(facts.commands)}\n\n## Existing patterns\n\n${patterns}\n\n## Safety notes\n\n- Do not edit \`.env\` files.\n- Do not commit secrets, tokens, private keys, or credentials.\n- Follow existing project conventions before introducing new patterns.\n- Do not add new dependencies unless the task clearly requires them.\n\n## Verification checklist\n\n${verificationList(facts.commands)}\n`; const rel = `.repoctx/packs/${slugify(task)}.md`; if (!options.stdout) writeText(path.join(facts.root, rel), content.trimEnd() + os.EOL); return { facts, path: rel, content: content.trimEnd() + os.EOL, ranked }; }

export function renderScan(facts, opts = {}) { const lines = []; lines.push(color('AgentCtx Scan', 'bold', opts.noColor)); lines.push(''); lines.push(`Repository: ${facts.name}`); lines.push(`Root: ${facts.root}`); lines.push(''); lines.push('Detected:'); lines.push(`  Language: ${languageLabel(facts.language)}`); lines.push(`  Framework: ${label(facts.framework.value)}`); lines.push(`  Package manager: ${label(facts.packageManager.value)}`); lines.push(`  Test runner: ${label(facts.testRunner.value)}`); lines.push(`  Linter: ${label(facts.linter.value)}`); lines.push(`  Monorepo: ${facts.monorepo.value ? 'Yes' : 'No'}`); if (facts.database) lines.push(`  Database: ${label(facts.database.value)}`); lines.push(`  CI: ${facts.ci.value ? 'Yes' : 'No'}`); lines.push(''); lines.push('Commands:'); for (const [key, value] of Object.entries(facts.commands)) lines.push(`  ${key}: ${value}`); if (!Object.keys(facts.commands).length) lines.push('  none detected'); lines.push(''); lines.push('Important files:'); for (const f of facts.importantFiles.slice(0, 8)) lines.push(`  - ${f.path} (${f.reason})`); if (!facts.importantFiles.length) lines.push('  none detected'); if (facts.risks.length) { lines.push(''); lines.push('Risks:'); for (const risk of facts.risks) lines.push(`  ${symbol(risk.level)} ${risk.message}`); } return lines.join('\n'); }
export function renderDoctor(report, opts = {}) { const lines = []; const scoreColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'yellow' : 'red'; lines.push(color('AgentCtx Doctor', 'bold', opts.noColor)); lines.push(''); lines.push(`AI Agent Readiness Score: ${color(String(report.score), scoreColor, opts.noColor)}/100`); lines.push(''); const sorted = [...report.checks].sort((a, b) => ({ critical: 0, error: 1, warning: 2, info: 3 }[a.level] ?? 9) - ({ critical: 0, error: 1, warning: 2, info: 3 }[b.level] ?? 9)); for (const check of sorted) lines.push(`${symbol(check.level)} ${check.message}`); const suggestions = sorted.filter(c => c.suggestion).map(c => c.suggestion); if (suggestions.length) { lines.push(''); lines.push('Suggested fixes:'); for (const s of [...new Set(suggestions)].slice(0, 10)) lines.push(`  - ${s}`); } return lines.join('\n'); }
export function printHelp() { return `AgentCtx ${VERSION}\n\nMake your repo agent-ready.\n\nUsage:\n  agentctx <command> [options]\n\nCommands:\n  scan       Scan repository facts\n  generate   Generate AI-agent context files\n  map        Generate .repoctx/repo-map.json and .repoctx/repo-map.md\n  doctor     Check AI agent readiness\n  pack       Create task-specific context pack\n\nOptions:\n  --root <path>       Repository root or path inside a repo\n  --json              Print JSON where supported\n  --stdout            Print generated content instead of writing where supported\n  --dry-run           Preview writes where supported\n  --force             Overwrite existing generated files where supported\n  --target <list>     agents,claude,gemini,copilot,cursor,llms,all\n  --ci                CI mode for doctor\n  --no-color          Disable colors\n  --help              Show help\n  --version           Show version\n\nExamples:\n  agentctx scan --root .\n  agentctx generate --target agents,claude,gemini,copilot,cursor\n  agentctx doctor --ci\n  agentctx pack "add login with Google OAuth"\n`; }
