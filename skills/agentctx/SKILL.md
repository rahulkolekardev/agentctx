---
name: agentctx
description: Make a repository ready for AI coding agents by scanning project facts and generating AGENTS.md, CLAUDE.md, GEMINI.md, Copilot instructions, Cursor rules, repo maps, doctor reports, and task-specific context packs. Use when preparing repos for Claude Code, OpenAI Codex, Gemini CLI, Google Antigravity, GitHub Copilot, Cursor, Windsurf, Amp, Aider, Cline, Roo Code, Continue, OpenHands, Replit Agent, Vercel Skills, or other coding agents.
license: MIT
compatibility: Requires Node.js 20+ when running bundled helper scripts. Works as an Agent Skills compatible skill with Claude Code, OpenAI Codex, Gemini CLI, Cursor, Copilot agent mode, Vercel Skills CLI installers, and as generic repo guidance for Antigravity, Windsurf, Amp, Aider, Cline, Roo Code, Continue, OpenHands, Replit Agent, and similar tools.
metadata:
  author: Rahul Kolekar
  version: "0.1.0"
  package: agentctx-skill
---

# AgentCtx Skill

Use this skill when the user asks to make a repository AI-agent-ready, generate `AGENTS.md`, create `CLAUDE.md` or `GEMINI.md`, improve Copilot/Cursor instructions, inspect repository context, create a repo map, check stale agent instructions, or build a task-specific context pack for a coding agent.


## Supported agents and outputs

Use the most specific output when available:

- OpenAI Codex, Amp, Aider, Google Antigravity, Windsurf, Cline, Roo Code, Continue, OpenHands, Replit Agent, Zed Agent Panel, and generic coding agents: `AGENTS.md`, `.repoctx/repo-map.md`, and task packs.
- Claude Code: `CLAUDE.md`.
- Gemini CLI and Gemini-based coding workflows: `GEMINI.md`.
- GitHub Copilot / Copilot coding agent: `.github/copilot-instructions.md`.
- Cursor: `.cursor/rules/project.mdc`.
- Web/docs LLM discovery: `llms.txt`.

When a tool has its own custom-instruction UI but no stable repo-file convention, use `AGENTS.md`, `llms.txt`, and `.repoctx/packs/*.md` as the portable source of truth.

## Core principle

Generate **minimal, evidence-backed context**. Do not create long prompt dumps. Do not invent commands, frameworks, scripts, or architecture details.

## Safety rules

- Never read, print, summarize, or copy `.env` files.
- Never include API keys, tokens, private keys, or secrets in generated context.
- Never guess commands. Use only commands detected from `package.json` scripts and lockfiles.
- If a fact is uncertain, mark it as uncertain or omit it.
- Keep context files short and practical.
- Prefer deterministic helper scripts when available.

## Available helper scripts

From the skill directory, use these scripts when possible:

```bash
node scripts/agentctx.mjs scan --root <repo>
node scripts/agentctx.mjs generate --root <repo>
node scripts/agentctx.mjs map --root <repo>
node scripts/agentctx.mjs doctor --root <repo>
node scripts/agentctx.mjs pack "<task>" --root <repo>
```

Individual scripts are also available:

```bash
node scripts/scan-repo.mjs --root <repo>
node scripts/generate-context.mjs --root <repo>
node scripts/doctor.mjs --root <repo>
node scripts/create-pack.mjs "<task>" --root <repo>
```

## Workflow: scan a repo

1. Run the scanner if scripts are available:

   ```bash
   node scripts/agentctx.mjs scan --root .
   ```

2. Inspect the detected facts:
   - package manager
   - framework
   - language
   - scripts
   - test runner
   - linter
   - database tooling
   - CI
   - important files

3. Report only facts supported by evidence.

## Workflow: generate agent context files

1. Scan the repo.
2. Generate only requested files, or defaults:
   - `AGENTS.md`
   - `CLAUDE.md`
   - `GEMINI.md`
   - `.github/copilot-instructions.md`
   - `.cursor/rules/project.mdc`
3. Include:
   - project overview
   - detected commands
   - verification checklist
   - important files
   - safety rules
4. Do not overwrite files unless user explicitly asks.

Preferred command:

```bash
node scripts/agentctx.mjs generate --root .
```

## Workflow: doctor report

Use this when the user asks whether the repo is ready for AI agents:

```bash
node scripts/agentctx.mjs doctor --root .
```

Check:

- missing context files
- stale commands
- package-manager contradictions
- oversized context
- secret-like content
- missing test/build/lint scripts
- missing README, license, or CI

## Workflow: task context pack

Use this when the user asks for a context pack for a specific task:

```bash
node scripts/agentctx.mjs pack "add login with Google OAuth" --root .
```

The pack should include:

- task summary
- repository summary
- likely relevant files with reasons
- relevant commands
- detected patterns
- safety notes
- verification checklist

Do not dump entire files unless explicitly requested.

## Reference files

Use supporting references only when needed:

- `references/detection-rules.md`
- `references/security-rules.md`
- `references/templates.md`
- `references/output-formats.md`

## Response style

When finished, summarize:

1. What was created or checked.
2. Key detected facts.
3. Any warnings or missing items.
4. Exact next commands the user can run.
