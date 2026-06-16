# AgentCtx Output Formats

## Scan report

Show repository name, root, detected facts, commands, important files, and risks.

## Doctor report

Show score from 0 to 100 and grouped checks:

- passing checks
- warnings
- errors
- critical issues
- suggested fixes

## Task context pack

The pack should include:

- task
- repository summary
- likely relevant files with reasons
- relevant commands
- existing patterns
- safety notes
- verification checklist


## Generated context files

AgentCtx can generate:

- `AGENTS.md` for Codex, Amp, Antigravity, Windsurf, Aider, Cline, Roo Code, Continue, OpenHands, Replit Agent, and generic agents.
- `CLAUDE.md` for Claude Code.
- `GEMINI.md` for Gemini CLI and Gemini-based coding workflows.
- `.github/copilot-instructions.md` for GitHub Copilot.
- `.cursor/rules/project.mdc` for Cursor.
- `llms.txt` for web/docs LLM guidance.
