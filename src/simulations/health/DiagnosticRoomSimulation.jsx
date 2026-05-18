import { render, useRef, useState } from '../../utils/react-lite.js'
import { askDiagnosticPatient, askDiagnosticPlanReview } from '../../ai/llamaClient.js'
import { healthCases } from './healthData.js'
import './DiagnosticRoomSimulation.css'

const DEFAULT_CASE_ID = 'acute-asthma'

function Icon({ name }) {
  const paths = {
    mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /><path d="M8 22h8" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1" /><path d="M3 14h4l2-4 4 8 2-4h6" /></>,
    clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M8 12h8" /><path d="M8 16h5" /></>,
    spark: <><path d="M12 2l1.8 5.6L19 10l-5.2 2.4L12 18l-1.8-5.6L5 10l5.2-2.4L12 2Z" /><path d="M19 15v4" /><path d="M21 17h-4" /></>,
  }

  return (
    <svg className="diagnostic-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.clipboard}
    </svg>
  )
}

function fallbackPatientReply(caseFile, question) {
  const lower = question.toLowerCase()
  if (lower.includes('pain') || lower.includes('chest')) {
    return caseFile.id === 'acute-asthma'
      ? 'My chest feels tight, mostly when I try to breathe out. It started after I cleaned a dusty room.'
      : 'I feel uncomfortable and worried, but the main problem is what I told you at the start.'
  }
  if (lower.includes('fever') || lower.includes('temperature')) {
    return caseFile.vitals.temp >= 38
      ? 'Yes, I have felt hot and weak since yesterday.'
      : 'I have not noticed a fever.'
  }
  if (lower.includes('medicine') || lower.includes('drug') || lower.includes('inhaler')) {
    return caseFile.id === 'acute-asthma'
      ? 'I have an inhaler, but I used it twice today and I am still wheezing.'
      : 'I am not sure of all the names. I can try to remember if you ask about a specific one.'
  }
  if (lower.includes('allerg')) return 'I do not know of any drug allergies.'
  if (lower.includes('how long') || lower.includes('when')) return 'It started earlier today and has been getting worse over the last few hours.'
  if (lower.includes('breath') || lower.includes('wheeze')) return 'I am short of breath and I can hear a whistling sound when I breathe.'
  return `I am worried because ${caseFile.presentation.charAt(0).toLowerCase()}${caseFile.presentation.slice(1)}`
}

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.96
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

function assessPlan(caseFile, diagnosis, prescription) {
  const cleanDiagnosis = diagnosis.trim()
  const cleanPrescription = prescription.trim()
  const warnings = []
  if (!cleanDiagnosis) warnings.push('State a provisional diagnosis before writing a plan.')
  if (!cleanPrescription) warnings.push('Write a safety-focused management plan before prescribing.')
  if (cleanPrescription && !/allerg|dose|route|monitor|reassess|refer|escalat|oxygen|fluid|test/i.test(cleanPrescription)) {
    warnings.push('Add safety checks: allergy, dose, route, monitoring, reassessment, and escalation criteria.')
  }
  if (caseFile.priority === 'Critical' && !/escalat|senior|urgent|emergency|admit|monitor/i.test(cleanPrescription)) {
    warnings.push('This high-acuity case needs escalation or monitored care in the plan.')
  }
  if (warnings.length) return warnings.join(' ')
  return 'Good educational plan structure: provisional diagnosis, immediate safety actions, medication checks, monitoring, and reassessment are represented.'
}

export default function DiagnosticRoomSimulation() {
  const [selectedCaseId, setSelectedCaseId] = useState(DEFAULT_CASE_ID)
  const [messages, setMessages] = useState(() => {
    const caseFile = healthCases.find((item) => item.id === DEFAULT_CASE_ID) || healthCases[0]
    return [{ role: 'patient', text: `Hello doctor. ${caseFile.presentation}` }]
  })
  const [diagnosis, setDiagnosis] = useState('')
  const [prescription, setPrescription] = useState('')
  const [feedback, setFeedback] = useState('Interview the patient, then draft a provisional diagnosis and safe prescription plan.')
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isReviewingPlan, setIsReviewingPlan] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('Voice input is in development.')
  const questionRef = useRef(null)
  const recognitionRef = useRef(null)

  const activeCase = healthCases.find((item) => item.id === selectedCaseId) || healthCases[0]

  const switchCase = (caseId) => {
    const nextCase = healthCases.find((item) => item.id === caseId) || healthCases[0]
    setSelectedCaseId(nextCase.id)
    setMessages([{ role: 'patient', text: `Hello doctor. ${nextCase.presentation}` }])
    setDiagnosis('')
    setPrescription('')
    setFeedback('New patient loaded. Start the diagnostic interview.')
  }

  const sendQuestion = async () => {
    const text = questionRef.current?.value.trim() || ''
    if (!text || isThinking) return
    const nextMessages = [...messages, { role: 'clinician', text }]
    setMessages([...nextMessages, { role: 'patient', text: '...' }])
    if (questionRef.current) questionRef.current.value = ''
    setIsThinking(true)
    const response = await askDiagnosticPatient({
      caseFile: activeCase,
      question: text,
      transcript: nextMessages,
    })
    const reply = response.text || fallbackPatientReply(activeCase, text)
    setMessages([...nextMessages, { role: 'patient', text: reply }])
    setFeedback(response.error ? `Local patient model unavailable. Fallback patient replied. ${response.error}` : 'Patient answered from the local model.')
    setIsThinking(false)
    speak(reply)
  }

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceStatus('Voice input is not available in this browser. Use typed interview.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => {
      setIsListening(true)
      setVoiceStatus('Listening...')
    }
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (questionRef.current) questionRef.current.value = transcript
      setVoiceStatus('Voice captured. Send when ready.')
    }
    recognition.onerror = () => setVoiceStatus('Voice capture failed. Use typed interview.')
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const submitPlan = async () => {
    if (isReviewingPlan) return
    const fallbackReview = assessPlan(activeCase, diagnosis, prescription)
    if (!diagnosis.trim() || !prescription.trim()) {
      setFeedback(fallbackReview)
      return
    }

    setIsReviewingPlan(true)
    setFeedback('Clinical instructor is reviewing your plan...')
    const response = await askDiagnosticPlanReview({
      caseFile: activeCase,
      transcript: messages,
      diagnosis,
      prescription,
    })
    setFeedback(response.text || `${fallbackReview}${response.error ? ` Local model unavailable: ${response.error}` : ''}`)
    setIsReviewingPlan(false)
  }

  return (
    <div className="diagnostic-room">
      <header className="diagnostic-header">
        <div>
          <span className="diagnostic-eyebrow">In development</span>
          <h1>Diagnostic Room</h1>
          <p>Voice interview, provisional diagnosis, and prescription-planning practice with a simulated patient.</p>
        </div>
        <div className="diagnostic-status">
          <Icon name="spark" />
          <strong>Educational simulation only</strong>
          <span>Not medical advice</span>
        </div>
      </header>

      <section className="diagnostic-layout">
        <aside className="diagnostic-panel">
          <div className="diagnostic-section-title">
            <Icon name="heart" />
            <h2>Patient</h2>
          </div>
          <select value={selectedCaseId} onChange={(event) => switchCase(event.target.value)}>
            {healthCases.map((caseFile) => <option value={caseFile.id}>{caseFile.patient} - {caseFile.title}</option>)}
          </select>
          <div className="diagnostic-vitals">
            <div><span>HR</span><strong>{activeCase.vitals.hr}</strong></div>
            <div><span>BP</span><strong>{activeCase.vitals.bp}</strong></div>
            <div><span>RR</span><strong>{activeCase.vitals.rr}</strong></div>
            <div><span>SpO2</span><strong>{activeCase.vitals.spo2}%</strong></div>
            <div><span>Temp</span><strong>{activeCase.vitals.temp}</strong></div>
          </div>
          <p className="diagnostic-case-note">{activeCase.location} - {activeCase.priority} priority</p>
        </aside>

        <main className="diagnostic-chat-card">
          <div className="diagnostic-section-title">
            <Icon name="mic" />
            <h2>Patient Interview</h2>
          </div>
          <div className="diagnostic-transcript" aria-label="Diagnostic interview transcript">
            {messages.map((message) => (
              <div className={`diagnostic-message ${message.role}`}>
                <span>{message.role === 'patient' ? 'Patient' : 'Clinician'}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="diagnostic-composer">
            <textarea ref={questionRef} rows="3" placeholder="Ask about symptoms, onset, history, medication, allergies, or red flags..."></textarea>
            <div className="diagnostic-actions">
              <button className="diagnostic-secondary-btn" type="button" onClick={isListening ? stopVoice : startVoice}>
                <Icon name="mic" />
                {isListening ? 'Stop' : 'Voice'}
              </button>
              <button className="diagnostic-primary-btn" type="button" onClick={sendQuestion} disabled={isThinking}>
                <Icon name="send" />
                {isThinking ? 'Asking...' : 'Send'}
              </button>
            </div>
          </div>
          <p className="diagnostic-status-line">{voiceStatus}</p>
        </main>

        <aside className="diagnostic-plan-card">
          <div className="diagnostic-section-title">
            <Icon name="clipboard" />
            <h2>Diagnosis Plan</h2>
          </div>
          <label>
            <span>Provisional diagnosis</span>
            <textarea value={diagnosis} onInput={(event) => setDiagnosis(event.target.value)} rows="4" placeholder="Example: acute asthma exacerbation with hypoxia..."></textarea>
          </label>
          <label>
            <span>Prescription and safety plan</span>
            <textarea value={prescription} onInput={(event) => setPrescription(event.target.value)} rows="6" placeholder="Include safety checks, dose/route placeholders, monitoring, escalation, and reassessment."></textarea>
          </label>
          <button className="diagnostic-primary-btn" type="button" onClick={submitPlan} disabled={isReviewingPlan}>
            {isReviewingPlan ? 'Reviewing...' : 'Review plan'}
          </button>
          <p className="diagnostic-feedback" role="status">{feedback}</p>
        </aside>
      </section>
    </div>
  )
}

export function mountDiagnosticRoomSimulation(container) {
  const app = render(DiagnosticRoomSimulation)
  container.appendChild(app.root)
  return app.cleanup
}
