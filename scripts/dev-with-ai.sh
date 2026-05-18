#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  if [[ -n "${AI_PID:-}" ]] && kill -0 "$AI_PID" >/dev/null 2>&1; then
    kill "$AI_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

bash "$ROOT_DIR/scripts/start-llama-desktop.sh" &
AI_PID=$!

export VITE_SIMLIT_LLM_PROVIDER="${VITE_SIMLIT_LLM_PROVIDER:-http}"
export VITE_SIMLIT_LLM_BASE_URL="${VITE_SIMLIT_LLM_BASE_URL:-http://127.0.0.1:8080/v1}"
export VITE_SIMLIT_LLM_MODEL="${VITE_SIMLIT_LLM_MODEL:-gemma-4-e2b-it-text-lite}"
export VITE_SIMLIT_LLM_MULTIMODAL_MODEL="${VITE_SIMLIT_LLM_MULTIMODAL_MODEL:-gemma-4-e2b-it-multimodal}"

npm run dev -- --host 127.0.0.1
