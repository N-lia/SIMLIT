function getBridge() {
  return window.SimlitAi || window.Capacitor?.Plugins?.SimlitAi || null
}

export async function chatCompletion({ messages, model, maxTokens = 220, temperature = 0.45, signal }) {
  const bridge = getBridge()
  if (!bridge || typeof bridge.generate !== 'function') {
    throw new Error('SIMLIT mobile AI bridge is not installed.')
  }

  if (signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError')
  }

  const response = await bridge.generate({
    model,
    messages,
    maxTokens,
    temperature,
  })

  return {
    text: response?.text || 'The mobile model returned an empty response.',
    tokensPerSecond: response?.tokensPerSecond,
    usage: {
      prompt_tokens: response?.promptTokens,
      completion_tokens: response?.outputTokens,
    },
    modelLoaded: response?.modelLoaded ?? true,
  }
}

export async function getRuntimeStatus() {
  const bridge = getBridge()
  if (!bridge) {
    return {
      provider: 'mobile',
      available: false,
      modelLoaded: false,
      detail: 'SIMLIT mobile AI bridge is not installed.',
    }
  }

  if (typeof bridge.getStatus !== 'function') {
    return {
      provider: 'mobile',
      available: true,
      modelLoaded: false,
      detail: 'SIMLIT mobile AI bridge exists, but status is not implemented yet.',
    }
  }

  return bridge.getStatus()
}
