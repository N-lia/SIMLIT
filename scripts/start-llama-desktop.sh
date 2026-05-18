#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

LLAMA_DIR="${SIMLIT_LLAMA_DIR:-"$ROOT_DIR/llama-b9204"}"
LLAMA_SERVER="${SIMLIT_LLAMA_SERVER:-"$LLAMA_DIR/llama-server"}"
MODEL_PATH="${SIMLIT_LLM_MODEL_PATH:-"$LLAMA_DIR/models/gemma-4-E2B-it-Q4_K_M.gguf"}"

HOST="${VITE_SIMLIT_LLM_HOST:-127.0.0.1}"
PORT="${VITE_SIMLIT_LLM_PORT:-8080}"
ALIASES="${SIMLIT_LLM_ALIASES:-gemma-4-e2b-it-text-lite,gemma-4-e2b-it-text-plus}"

CTX_SIZE="${SIMLIT_LLM_CTX_SIZE:-2048}"
BATCH_SIZE="${SIMLIT_LLM_BATCH_SIZE:-256}"
UBATCH_SIZE="${SIMLIT_LLM_UBATCH_SIZE:-64}"
THREADS="${SIMLIT_LLM_THREADS:-4}"
FLASH_ATTN="${SIMLIT_LLM_FLASH_ATTN:-auto}"
PARALLEL_SLOTS="${SIMLIT_LLM_PARALLEL:-1}"
SWA_FULL="${SIMLIT_LLM_SWA_FULL:-0}"

SWA_ARGS=()
if [[ "$SWA_FULL" == "1" || "$SWA_FULL" == "true" || "$SWA_FULL" == "on" ]]; then
  SWA_ARGS+=(--swa-full)
fi

if [[ ! -x "$LLAMA_SERVER" ]]; then
  echo "SIMLIT AI: llama-server was not found or is not executable:" >&2
  echo "  $LLAMA_SERVER" >&2
  exit 1
fi

if [[ ! -f "$MODEL_PATH" ]]; then
  echo "SIMLIT AI: GGUF model was not found:" >&2
  echo "  $MODEL_PATH" >&2
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 2 "http://$HOST:$PORT/health" >/dev/null 2>&1; then
    echo "SIMLIT AI: llama.cpp server is already running at http://$HOST:$PORT"
    exit 0
  fi
fi

echo "SIMLIT AI: starting llama.cpp desktop server"
echo "  model:   $MODEL_PATH"
echo "  aliases: $ALIASES"
echo "  url:     http://$HOST:$PORT/v1"

exec "$LLAMA_SERVER" \
  -m "$MODEL_PATH" \
  -a "$ALIASES" \
  --host "$HOST" \
  --port "$PORT" \
  -c "$CTX_SIZE" \
  -b "$BATCH_SIZE" \
  -ub "$UBATCH_SIZE" \
  -t "$THREADS" \
  -np "$PARALLEL_SLOTS" \
  -fa "$FLASH_ATTN" \
  "${SWA_ARGS[@]}" \
  --reasoning off
