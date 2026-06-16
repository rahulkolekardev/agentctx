# AgentCtx Templates

## AGENTS.md

```md
# AGENTS.md

## Project overview

This is a {{frameworkLabel}} project using {{languageLabel}}.

Detected evidence:
{{evidenceList}}

## Commands

{{commandsList}}

## Working guidelines

- Make minimal, focused changes.
- Follow existing patterns in nearby files.
- Do not add new runtime dependencies unless necessary.
- Do not edit generated files unless requested.
- Do not read, print, or modify secret files such as `.env`.

## Verification

Before finishing, run the relevant available commands:

{{verificationList}}

## Important files

{{importantFilesList}}
```

## CLAUDE.md

```md
# CLAUDE.md

This file provides project guidance for Claude Code.

## Repository summary

{{summary}}

## Development commands

{{commandsList}}

## Architecture notes

{{architectureNotes}}

## Working rules

- Prefer small, reviewable edits.
- Reuse existing utilities and patterns.
- Update or add tests when behavior changes.
- Avoid changing public APIs unless explicitly requested.
- Never expose secrets or `.env` values.

## Verification checklist

{{verificationList}}
```


## GEMINI.md

```md
# GEMINI.md

This file provides project context for Gemini CLI and Gemini-based coding workflows.

## Repository summary

{{summary}}

## Development commands

{{commandsList}}

## Architecture notes

{{architectureNotes}}

## Working rules

- Make minimal, reviewable edits.
- Prefer existing project patterns and nearby code.
- Use only detected commands; do not invent scripts.
- Never expose secrets or `.env` values.

## Verification checklist

{{verificationList}}
```
