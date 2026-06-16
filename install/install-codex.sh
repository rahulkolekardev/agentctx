#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.agents/skills/agentctx}"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/skills/agentctx"
mkdir -p "$TARGET"
cp -R "$SOURCE"/* "$TARGET"/
echo "Installed AgentCtx skill to $TARGET"
