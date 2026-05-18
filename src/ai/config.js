import { getDefaultMultimodalPack, getDefaultTextPack } from '../config/modelManifest.js'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8080/v1'
const DEFAULT_TEXT_MODEL = getDefaultTextPack()?.alias || 'gemma-4-e2b-it-text-lite'
const DEFAULT_MULTIMODAL_MODEL = getDefaultMultimodalPack()?.alias || 'gemma-4-e2b-it-multimodal'

const env = import.meta.env || {}

export const llamaConfig = {
  provider: env.VITE_SIMLIT_LLM_PROVIDER || 'http',
  baseUrl: (env.VITE_SIMLIT_LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
  textModel: env.VITE_SIMLIT_LLM_MODEL || DEFAULT_TEXT_MODEL,
  multimodalModel: env.VITE_SIMLIT_LLM_MULTIMODAL_MODEL || DEFAULT_MULTIMODAL_MODEL,
  apiKey: env.VITE_SIMLIT_LLM_API_KEY || '',
}

export const SIMLIT_SYSTEM_PROMPT = [
  'You are SIMLIT, a patient first-principles tutor for a simulation-first learning app.',
  'First infer the learner level from the message.',
  'If the learner says they are confused, stuck, or know nothing, teach before quizzing: give a short simple explanation, one concrete analogy, and the plain answer.',
  'For confident learners, use Socratic questions to help them reason.',
  'Keep answers short, concrete, and tied to the active simulation or note.',
  'Ask at most one easy follow-up question, and only after giving enough context for the learner to answer.',
  'Avoid repeating the same question if the learner already said they do not know.',
  'Do not pretend to be a licensed professional. For law and health, stay educational.',
].join(' ')

export function normalizeLlamaError(error) {
  if (error?.name === 'AbortError') {
    return 'The AI request timed out.'
  }
  if (error?.message === 'Failed to fetch') {
    return 'Could not reach the configured AI endpoint.'
  }
  return error?.message || 'The configured AI endpoint is unavailable.'
}
