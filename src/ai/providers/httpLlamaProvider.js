import { llamaConfig } from '../config.js'

function runtimeBaseUrl() {
  return llamaConfig.baseUrl.replace(/\/v1$/, '').replace(/\/api\/v1$/, '')
}

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (llamaConfig.apiKey) {
    headers.Authorization = `Bearer ${llamaConfig.apiKey}`
  }
  return headers
}

export async function chatCompletion({ messages, model, maxTokens = 220, temperature = 0.45, signal }) {
  const response = await fetch(`${llamaConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    signal,
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || `llama.cpp returned HTTP ${response.status}`)
  }

  const text = payload?.choices?.[0]?.message?.content
  return {
    text: typeof text === 'string' && text.trim() ? text.trim() : 'I could not form a response from the local model.',
    timings: payload?.timings || null,
    usage: payload?.usage || null,
    modelLoaded: true,
  }
}

export async function getRuntimeStatus() {
  try {
    const isLocalRuntime = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\b/i.test(llamaConfig.baseUrl)
    const statusUrl = isLocalRuntime
      ? `${runtimeBaseUrl()}/health`
      : `${llamaConfig.baseUrl}/models`
    const response = await fetch(statusUrl, {
      headers: isLocalRuntime ? undefined : buildHeaders(),
    })
    return {
      provider: 'http',
      available: response.ok,
      modelLoaded: response.ok,
      detail: response.ok ? 'The configured AI endpoint is reachable.' : `Health check failed with HTTP ${response.status}.`,
    }
  } catch (error) {
    return {
      provider: 'http',
      available: false,
      modelLoaded: false,
      detail: error?.message || 'llama.cpp HTTP server is unavailable.',
    }
  }
}
