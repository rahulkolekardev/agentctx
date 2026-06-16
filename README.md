# AgentCtx

**Make your repo agent-ready.**

AgentCtx is an agent skill plus deterministic Node.js helper scripts that prepare repositories for AI coding agents such as Claude Code, OpenAI Codex, Gemini CLI, Google Antigravity, GitHub Copilot, Cursor, Windsurf, Amp, Aider, Cline, Roo Code, Continue, OpenHands, Replit Agent, Zed Agent Panel, and generic LLM tools.

It scans a repository, detects project facts, generates minimal evidence-backed context files, checks stale or risky instructions, and creates task-specific context packs.

## Why AgentCtx?

AI coding agents work better when they understand:

- project commands
- package manager and framework
- repo structure
- architecture patterns
- safety rules
- verification steps

AgentCtx does **not** dump your entire codebase into prompts. It generates short, useful, repo-specific guidance.

## What it creates

| Target | File |
|---|---|
| Codex / generic agents | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| Gemini CLI / Gemini-based coding workflows | `GEMINI.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/project.mdc` |
| Web/docs LLM guidance | `llms.txt` |
| Repo map | `.repoctx/repo-map.json`, `.repoctx/repo-map.md` |
| Task pack | `.repoctx/packs/<task>.md` |

## Quick start

Run directly from this repo:

```bash
node skills/agentctx/scripts/agentctx.mjs scan --root examples/nextjs-app
node skills/agentctx/scripts/agentctx.mjs generate --root examples/nextjs-app --dry-run
node skills/agentctx/scripts/agentctx.mjs doctor --root examples/nextjs-app
node skills/agentctx/scripts/agentctx.mjs pack "add login with Google OAuth" --root examples/nextjs-app
```

If published as an npm binary later, the same commands can become:

```bash
npx agentctx scan
npx agentctx generate
npx agentctx doctor
npx agentctx pack "add login with Google OAuth"
```



## Agent coverage

AgentCtx is designed to create reusable repo guidance that works across many AI coding agents.

| Agent / platform | Primary AgentCtx output | Notes |
|---|---|---|
| OpenAI Codex | `AGENTS.md` | Generic repo instructions and verification commands. |
| Claude Code | `CLAUDE.md` | Claude-specific project memory/instructions. |
| Gemini CLI | `GEMINI.md` | Gemini CLI project context file. |
| Google Antigravity | `AGENTS.md`, `.repoctx/repo-map.md`, task packs | Use generated repo guidance and task packs as agent instructions. |
| GitHub Copilot / Copilot coding agent | `.github/copilot-instructions.md` | Repo-level Copilot instructions. |
| Cursor | `.cursor/rules/project.mdc` | Project-wide Cursor rules. |
| Windsurf / Cascade | `AGENTS.md`, repo map, task packs | Copy generated guidance into Windsurf custom instructions when needed. |
| Amp | `AGENTS.md`, repo map, task packs | Generic agent instructions and verification commands. |
| Aider | `AGENTS.md`, repo map, task packs | Use as onboarding/context before editing. |
| Cline / Roo Code | `AGENTS.md`, repo map, task packs | Use as project rules/context. |
| Continue / OpenHands / Replit Agent / Zed Agent Panel | `AGENTS.md`, `llms.txt`, repo map, task packs | Generic context files plus task-specific packs. |

The default generation target is:

```bash
node skills/agentctx/scripts/agentctx.mjs generate --target agents,claude,gemini,copilot,cursor --root .
```

Use `--target all` to also create `llms.txt`.

## Install from Vercel Skills CLI

After pushing this repo to GitHub, users can install the skill with:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx
```

Install globally for Claude Code:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx -g -a claude-code -y
```

Install into a project for supported agents such as Codex, Cursor, and Copilot agent mode:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx -a codex -a cursor -y
```

List available skills in this repo:

```bash
npx skills add rahulkolekardev/agentctx --list
```

## Install from npm

After publishing to npm:

```bash
npm install -D agentctx-skill
npx agentctx scan --root .
npx agentctx generate --root . --dry-run
npx agentctx doctor --root .
```

You can also run without installing:

```bash
npx agentctx-skill scan --root .
```

This npm package bundles the Agent Skills-compatible folder at `skills/agentctx/SKILL.md`, so skill installers can discover it from `node_modules/**/skills/*/SKILL.md`.

## Publishing

See [`PUBLISHING.md`](PUBLISHING.md) for GitHub, Vercel Skills CLI, and npm release steps.

## Skill installation

### Claude Code personal skill

```bash
mkdir -p ~/.claude/skills/agentctx
cp -R skills/agentctx/* ~/.claude/skills/agentctx/
```

### Claude Code project skill

```bash
mkdir -p .claude/skills/agentctx
cp -R skills/agentctx/* .claude/skills/agentctx/
```

### Codex project skill

```bash
mkdir -p .agents/skills/agentctx
cp -R skills/agentctx/* .agents/skills/agentctx/
```

## Commands

### Scan

```bash
node skills/agentctx/scripts/agentctx.mjs scan --root .
node skills/agentctx/scripts/agentctx.mjs scan --root . --json
```

Detects framework, package manager, language, scripts, database tooling, CI, and important files.

### Generate

```bash
node skills/agentctx/scripts/agentctx.mjs generate --root .
node skills/agentctx/scripts/agentctx.mjs generate --root . --target agents,claude,gemini,copilot,cursor,llms
node skills/agentctx/scripts/agentctx.mjs generate --root . --dry-run
node skills/agentctx/scripts/agentctx.mjs generate --root . --force
```

Generates short AI-agent instruction files. Existing files are not overwritten unless `--force` is passed.

### Map

```bash
node skills/agentctx/scripts/agentctx.mjs map --root .
node skills/agentctx/scripts/agentctx.mjs map --root . --stdout
```

Creates `.repoctx/repo-map.json` and `.repoctx/repo-map.md`.

### Doctor

```bash
node skills/agentctx/scripts/agentctx.mjs doctor --root .
node skills/agentctx/scripts/agentctx.mjs doctor --root . --json
node skills/agentctx/scripts/agentctx.mjs doctor --root . --ci
```

Calculates an AI Agent Readiness Score and reports missing context files, stale commands, package-manager contradictions, oversized files, missing scripts, missing README/license/CI, and possible secrets.

### Pack

```bash
node skills/agentctx/scripts/agentctx.mjs pack "fix Stripe webhook bug" --root .
node skills/agentctx/scripts/agentctx.mjs pack "add auth" --root . --stdout
```

Creates a task-specific context pack with likely relevant files, reasons, commands, safety notes, and verification checklist.

## Examples

This repo includes sample projects:

- `examples/nextjs-app`
- `examples/express-api`
- `examples/nestjs-api`

## Security

AgentCtx ignores sensitive files by default:

- `.env`, `.env.*`
- private keys
- `.git`
- `node_modules`
- generated build folders
- cache folders

It also scans generated/context files for obvious secret patterns such as API keys, private keys, GitHub tokens, Slack bot tokens, and cloud credentials.

## Why not just use repo packers?

Repo packers are useful when you want to paste a codebase into an LLM. AgentCtx is different:

- It does not dump all source code.
- It creates minimal agent instructions.
- It validates stale or unsafe context.
- It creates task-specific context packs.
- It is designed for Codex, Claude Code, Gemini CLI, Google Antigravity, Copilot, Cursor, Windsurf, Amp, Aider, Cline, Roo Code, Continue, OpenHands, Replit Agent, and similar tools.

## Local validation

```bash
npm run validate
```

This runs syntax checks, tests, and smoke tests against the sample projects.

## Roadmap

- npm installer package
- GitHub Action
- readiness badge
- Python/FastAPI detector
- Laravel detector
- deeper dependency graph
- MCP server
- VS Code extension

## License

MIT
