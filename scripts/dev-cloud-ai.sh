#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.demo.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.demo.local"
  set +a
fi

API_KEY="${VITE_SIMLIT_LLM_API_KEY:-${SIMLIT_LLM_API_KEY:-}}"

if [[ -z "$API_KEY" ]]; then
  echo "SIMLIT demo AI: missing API key." >&2
  echo "Set VITE_SIMLIT_LLM_API_KEY or create .env.demo.local from .env.demo.example." >&2
  exit 1
fi

export VITE_SIMLIT_LLM_PROVIDER="${VITE_SIMLIT_LLM_PROVIDER:-http}"
export VITE_SIMLIT_LLM_BASE_URL="${VITE_SIMLIT_LLM_BASE_URL:-https://api.openai.com/v1}"
export VITE_SIMLIT_LLM_MODEL="${VITE_SIMLIT_LLM_MODEL:-gpt-4o-mini}"
export VITE_SIMLIT_LLM_MULTIMODAL_MODEL="${VITE_SIMLIT_LLM_MULTIMODAL_MODEL:-$VITE_SIMLIT_LLM_MODEL}"
export VITE_SIMLIT_LLM_API_KEY="$API_KEY"

echo "SIMLIT demo AI: starting with remote OpenAI-compatible API"
echo "  base url: $VITE_SIMLIT_LLM_BASE_URL"
echo "  model:    $VITE_SIMLIT_LLM_MODEL"

npm run dev -- --host 127.0.0.1
