#!/usr/bin/env bash
# Tejas AI — 3D Digital Twin · one-command launcher
# ------------------------------------------------------------------
# Usage:
#   ./run.sh                      # uses OPENAI_API_KEY from your shell (if set)
#   OPENAI_API_KEY=sk-... ./run.sh
#
# Then open the URL it prints (http://localhost:7878).
set -e
cd "$(dirname "$0")"

# pick python3 if present, else python
PY="$(command -v python3 || command -v python)"
if [ -z "$PY" ]; then
  echo "Python 3 is required but was not found. Install it and retry." >&2
  exit 1
fi

# friendly note about the AI brain
if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "ℹ  OPENAI_API_KEY not set — the twin will use local Ollama if running, else a built-in parser."
  echo "   To use OpenAI:  export OPENAI_API_KEY=sk-...   then run ./run.sh again."
fi

exec "$PY" server.py
