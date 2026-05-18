import { llamaConfig, normalizeLlamaError, SIMLIT_SYSTEM_PROMPT } from './config.js'
import { getLlamaProvider } from './providers/index.js'

function buildMultimodalContent(question, attachments) {
  const content = [{ type: 'text', text: question || 'Explain this attached learning material.' }]

  attachments.forEach((attachment) => {
    if (attachment.type.startsWith('image/')) {
      content.push({
        type: 'image_url',
        image_url: { url: attachment.dataUrl },
      })
    } else if (attachment.type.startsWith('audio/')) {
      const base64 = String(attachment.dataUrl).split(',')[1] || ''
      content.push({
        type: 'input_audio',
        input_audio: {
          data: base64,
          format: attachment.type.includes('mpeg') ? 'mp3' : 'wav',
        },
      })
    }
  })

  return content
}

async function chatCompletion(options) {
  const provider = getLlamaProvider()
  return provider.chatCompletion(options)
}

export async function getLlamaRuntimeStatus() {
  const provider = getLlamaProvider()
  if (typeof provider.getRuntimeStatus !== 'function') {
    return {
      provider: llamaConfig.provider,
      available: false,
      modelLoaded: false,
      detail: 'The selected llama provider does not expose runtime status.',
    }
  }
  return provider.getRuntimeStatus()
}

function buildTutorHistory(transcript = []) {
  return transcript.slice(-8).map((item) => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: String(item.content || '').slice(0, 900),
  })).filter((item) => item.content.trim())
}

export async function askSimlitTutor({ question, noteTitle = '', noteContent = '', attachments = [], transcript = [], signal }) {
  const cleanQuestion = question.trim()
  const hasMedia = attachments.length > 0
  const userContent = hasMedia
    ? buildMultimodalContent(cleanQuestion, attachments)
    : [
        `Question: ${cleanQuestion}`,
        noteTitle ? `Current note title: ${noteTitle}` : '',
        noteContent ? `Current note excerpt: ${noteContent.slice(0, 1400)}` : '',
      ].filter(Boolean).join('\n\n')

  try {
    return await chatCompletion({
      model: hasMedia ? llamaConfig.multimodalModel : llamaConfig.textModel,
      signal,
      messages: [
        { role: 'system', content: SIMLIT_SYSTEM_PROMPT },
        ...buildTutorHistory(transcript),
        { role: 'user', content: userContent },
      ],
    })
  } catch (error) {
    return {
      text: `${normalizeLlamaError(error)} Check your demo API settings or start the local SIMLIT AI engine, then try again.`,
      error: true,
    }
  }
}

export async function askOpposingCounsel({ caseFile, argument, signal }) {
  try {
    return await chatCompletion({
      model: llamaConfig.textModel,
      maxTokens: 180,
      temperature: 0.5,
      signal,
      messages: [
        {
          role: 'system',
          content: [
            'You are opposing counsel in a Nigerian law training simulation.',
            'Reply in one concise paragraph.',
            'Challenge weak legal authority, foundation, remedy, and fact linkage.',
            'This is educational role-play, not legal advice.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Case: ${caseFile.parties}`,
            `Jurisdiction: ${caseFile.jurisdiction}`,
            `Statute or rule anchor: ${caseFile.statute}`,
            `Facts: ${caseFile.facts}`,
            `Student submission: ${argument}`,
          ].join('\n'),
        },
      ],
    })
  } catch (error) {
    return {
      text: '',
      error: normalizeLlamaError(error),
    }
  }
}

export async function askLawCaseTutor({ caseFile, progress = 0, signal }) {
  try {
    return await chatCompletion({
      model: llamaConfig.textModel,
      maxTokens: 190,
      temperature: 0.4,
      signal,
      messages: [
        {
          role: 'system',
          content: [
            'You are a legal education tutor for a Nigerian law simulation.',
            'This is training, not legal advice.',
            'Give concise case-prep guidance.',
            'Cover issue, rule anchor, evidence/fact weakness, and one next practice move.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Case title: ${caseFile.title}`,
            `Parties: ${caseFile.parties}`,
            `Practice area: ${caseFile.type}`,
            `Jurisdiction: ${caseFile.jurisdiction}`,
            `Rule/statute anchor: ${caseFile.statute}`,
            `Facts: ${caseFile.facts}`,
            `Skill target: ${caseFile.skill}`,
            `Current learner progress: ${progress}%`,
            `Next step shown in app: ${caseFile.nextStep}`,
          ].join('\n'),
        },
      ],
    })
  } catch (error) {
    return {
      text: '',
      error: normalizeLlamaError(error),
    }
  }
}

export async function askDiagnosticPatient({ caseFile, question, transcript = [], signal }) {
  try {
    return await chatCompletion({
      model: llamaConfig.textModel,
      maxTokens: 140,
      temperature: 0.55,
      signal,
      messages: [
        {
          role: 'system',
          content: [
            'You are a simulated patient in an educational diagnostic room.',
            'Answer only as the patient using first person.',
            'Reveal symptoms, history, medication use, allergies, and concerns when asked.',
            'Do not diagnose yourself, prescribe treatment, or give medical advice.',
            'Keep replies concise and realistic.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Patient: ${caseFile.patient}`,
            `Presentation: ${caseFile.presentation}`,
            `Vitals: HR ${caseFile.vitals.hr}, BP ${caseFile.vitals.bp}, RR ${caseFile.vitals.rr}, SpO2 ${caseFile.vitals.spo2}%, Temp ${caseFile.vitals.temp}`,
            `Clinical focus hidden from learner: ${caseFile.focus}`,
            `Recent transcript: ${transcript.slice(-6).map((item) => `${item.role}: ${item.text}`).join('\n')}`,
            `Clinician question: ${question}`,
          ].join('\n'),
        },
      ],
    })
  } catch (error) {
    return {
      text: '',
      error: normalizeLlamaError(error),
    }
  }
}

export async function askDiagnosticPlanReview({ caseFile, transcript = [], diagnosis, prescription, signal }) {
  try {
    return await chatCompletion({
      model: llamaConfig.textModel,
      maxTokens: 220,
      temperature: 0.35,
      signal,
      messages: [
        {
          role: 'system',
          content: [
            'You are a clinical instructor in an educational medical simulation.',
            'Review the learner plan for reasoning and safety, not as real medical advice.',
            'Be concise and practical.',
            'Structure the response as: Strengths, Missing or unsafe points, Safer next step.',
            'Do not give definitive real-world dosing. Use placeholders such as dose per local protocol or senior review.',
            'Escalate high-acuity red flags and remind that this is supervised training.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Patient: ${caseFile.patient}`,
            `Presentation: ${caseFile.presentation}`,
            `Priority: ${caseFile.priority}`,
            `Vitals: HR ${caseFile.vitals.hr}, BP ${caseFile.vitals.bp}, RR ${caseFile.vitals.rr}, SpO2 ${caseFile.vitals.spo2}%, Temp ${caseFile.vitals.temp}`,
            `Clinical focus for instructor: ${caseFile.focus}`,
            `Interview transcript: ${transcript.slice(-10).map((item) => `${item.role}: ${item.text}`).join('\n')}`,
            `Learner provisional diagnosis: ${diagnosis}`,
            `Learner prescription and safety plan: ${prescription}`,
          ].join('\n'),
        },
      ],
    })
  } catch (error) {
    return {
      text: '',
      error: normalizeLlamaError(error),
    }
  }
}

export async function askClinicalStepFeedback({ caseFile, step, selectedOption, correct, displayedVitals, signal }) {
  try {
    return await chatCompletion({
      model: llamaConfig.textModel,
      maxTokens: 160,
      temperature: 0.35,
      signal,
      messages: [
        {
          role: 'system',
          content: [
            'You are a clinical instructor in a supervised educational simulation.',
            'Explain the learner choice in one short paragraph.',
            'Focus on patient safety, red flags, reassessment, and why the best option is safer.',
            'Do not provide real medical advice or definitive prescribing doses.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Patient: ${caseFile.patient}`,
            `Presentation: ${caseFile.presentation}`,
            `Priority: ${caseFile.priority}`,
            `Vitals now: HR ${displayedVitals.hr}, BP ${displayedVitals.bp}, RR ${displayedVitals.rr}, SpO2 ${displayedVitals.spo2}%, Temp ${displayedVitals.temp}`,
            `Step skill: ${step.skill}`,
            `Prompt: ${step.prompt}`,
            `Learner choice: ${selectedOption}`,
            `Safest option: ${step.answer}`,
            `Was learner correct: ${correct ? 'yes' : 'no'}`,
            `Reference note: ${correct ? step.consequence : step.review}`,
          ].join('\n'),
        },
      ],
    })
  } catch (error) {
    return {
      text: '',
      error: normalizeLlamaError(error),
    }
  }
}

export function readAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        dataUrl: reader.result,
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
