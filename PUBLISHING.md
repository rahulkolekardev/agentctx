# Publishing AgentCtx

This repo is ready for two distribution channels:

1. **Vercel/open Agent Skills ecosystem** via GitHub and `npx skills add`.
2. **npm** as a package that bundles `skills/agentctx/SKILL.md` and helper scripts.

## 1. Publish to GitHub for Vercel Skills CLI

Create a public GitHub repo, for example:

```bash
git init
git add .
git commit -m "Initial AgentCtx skill"
git branch -M main
git remote add origin https://github.com/rahulkolekardev/agentctx.git
git push -u origin main
```

Users can then install it with:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx
```

Install globally for Claude Code:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx -g -a claude-code -y
```

Install into a project for Codex, Gemini CLI, Cursor, Copilot, and generic agent-compatible workflows:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx -a codex -a cursor -y
```

List skills in the repo:

```bash
npx skills add rahulkolekardev/agentctx --list
```

## Supported agent coverage

Mention this in the GitHub description, README, and npm keywords:

- Claude Code
- OpenAI Codex
- Gemini CLI
- Google Antigravity
- GitHub Copilot / Copilot coding agent
- Cursor
- Windsurf / Cascade
- Amp
- Aider
- Cline
- Roo Code
- Continue
- OpenHands
- Replit Agent
- Zed Agent Panel
- Generic LLM coding agents

AgentCtx now generates `GEMINI.md` in addition to `AGENTS.md`, `CLAUDE.md`, Copilot instructions, Cursor rules, repo maps, and task packs.

## 2. Publish to npm

The package is currently named:

```json
"name": "agentctx-skill"
```

Before publishing, check availability:

```bash
npm view agentctx-skill name
```

If it already exists, change the package name to your own npm scope, for example:

```json
"name": "@rahulkolekardev/agentctx-skill"
```

Then run:

```bash
npm login
npm run publish:check
npm publish --access public
```

Users can run the CLI directly:

```bash
npx agentctx-skill scan --root .
npx agentctx-skill generate --root . --dry-run
npx agentctx-skill doctor --root .
npx agentctx-skill pack "add authentication" --root .
```

Because the package exposes a binary called `agentctx`, users can also run after local install:

```bash
npm install -D agentctx-skill
npx agentctx scan --root .
```

## 3. npm bundled skills convention

This package includes:

```text
skills/agentctx/SKILL.md
skills/agentctx/scripts/*.mjs
skills/agentctx/references/*.md
```

The `package.json` `files` array includes `skills/`, so npm publishes the skill folder. Skill installers that scan `node_modules/**/skills/*/SKILL.md` can discover it after installation.

## 4. Release checklist

```bash
npm run validate
npm run pack:dry-run
npm publish --dry-run
```

Then verify install from GitHub:

```bash
npx skills add rahulkolekardev/agentctx --skill agentctx --copy -y
```

And from npm after publishing:

```bash
npm install -D agentctx-skill
npx agentctx --help
```

## 5. Security notes

- Keep the package dependency-free unless absolutely necessary.
- Never add postinstall scripts.
- Keep helper scripts deterministic and auditable.
- Do not request API keys or agent credentials.
- Run `npm pack --dry-run` before every publish to verify package contents.
