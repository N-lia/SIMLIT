import { render, useMemo, useState } from '../../utils/react-lite.js'
import { askClinicalStepFeedback } from '../../ai/llamaClient.js'
import { clinicalSchedule, clinicalSteps, clinicalTools, healthCases } from './healthData.js'
import './HealthClinicalRoomSimulation.css'

function Icon({ name }) {
  const paths = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1" /><path d="M3 14h4l2-4 4 8 2-4h6" /></>,
    clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M8 12h8" /><path d="M8 16h5" /></>,
    check: <path d="M20 6 9 17l-5-5" />,
    pulse: <path d="M3 12h4l2-7 5 14 3-7h4" />,
    people: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
  }

  return (
    <svg className="clinic-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.clipboard}
    </svg>
  )
}

const toolIconById = {
  abcde: 'pulse',
  vitals: 'heart',
  differentials: 'clipboard',
  'med-safety': 'check',
  handover: 'people',
  'patient-education': 'clipboard',
}
const HEALTH_PROGRESS_KEY = 'simlit_health_case_progress'
const HEALTH_ATTEMPTS_KEY = 'simlit_clinical_room_attempts'

function readStoredMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

function writeStoredMap(key, nextMap) {
  localStorage.setItem(key, JSON.stringify(nextMap))
}

function recordClinicalResult(caseId, scorePercent) {
  const progressMap = readStoredMap(HEALTH_PROGRESS_KEY)
  const currentProgress = progressMap[caseId] || 0
  const earnedProgress = scorePercent >= 80 ? 100 : scorePercent >= 50 ? 80 : 65
  writeStoredMap(HEALTH_PROGRESS_KEY, {
    ...progressMap,
    [caseId]: Math.max(currentProgress, earnedProgress),
  })

  const attempts = readStoredMap(HEALTH_ATTEMPTS_KEY)
  const previous = attempts[caseId] || { bestScore: 0, attempts: 0 }
  writeStoredMap(HEALTH_ATTEMPTS_KEY, {
    ...attempts,
    [caseId]: {
      bestScore: Math.max(previous.bestScore || 0, scorePercent),
      lastScore: scorePercent,
      attempts: (previous.attempts || 0) + 1,
      completedAt: new Date().toISOString(),
    },
  })
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getDynamicVitals(caseFile, answers) {
  const totalAnswered = Object.keys(answers).length
  const correctCount = Object.values(answers).filter((answer) => answer?.correct).length
  const missedCount = totalAnswered - correctCount
  const spo2 = clamp(caseFile.vitals.spo2 + correctCount * 2 - missedCount * 2, 82, 100)
  const rr = clamp(caseFile.vitals.rr - correctCount * 2 + missedCount * 3, 10, 44)
  const hr = clamp(caseFile.vitals.hr - correctCount * 4 + missedCount * 6, 50, 160)
  return { ...caseFile.vitals, spo2, rr, hr }
}

function getVitalsTrend(caseFile, vitals) {
  if (vitals.spo2 > caseFile.vitals.spo2 || vitals.rr < caseFile.vitals.rr) return 'Responding'
  if (vitals.spo2 < caseFile.vitals.spo2 || vitals.rr > caseFile.vitals.rr) return 'Deteriorating'
  return 'Baseline'
}

export default function HealthClinicalRoomSimulation() {
  const [selectedScheduleId, setSelectedScheduleId] = useState(clinicalSchedule[0].caseId)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showDebrief, setShowDebrief] = useState(false)
  const [resultRecorded, setResultRecorded] = useState(false)
  const [activeToolId, setActiveToolId] = useState(clinicalTools[0].id)
  const [instructorFeedback, setInstructorFeedback] = useState('')
  const [isCoaching, setIsCoaching] = useState(false)
  const [notice, setNotice] = useState('Clinical room ready. Choose the safest next move for each stage.')

  const activeSchedule = clinicalSchedule.find((item) => item.caseId === selectedScheduleId) || clinicalSchedule[0]
  const activeCase = healthCases.find((patientCase) => patientCase.id === activeSchedule.caseId) || healthCases[0]
  const activeStep = clinicalSteps[stepIndex]
  const activeTool = clinicalTools.find((tool) => tool.id === activeToolId) || clinicalTools[0]
  const score = Object.values(answers).filter((answer) => answer?.correct).length
  const answered = Object.prototype.hasOwnProperty.call(answers, activeStep.id)
  const activeAnswer = answers[activeStep.id]
  const completedSteps = Object.keys(answers).length
  const safetyScore = Math.round((score / clinicalSteps.length) * 100)
  const displayedVitals = getDynamicVitals(activeCase, answers)
  const vitalsTrend = getVitalsTrend(activeCase, displayedVitals)

  const activePatients = useMemo(() => {
    return clinicalSchedule.map((item) => ({
      ...item,
      case: healthCases.find((patientCase) => patientCase.id === item.caseId),
    })).filter((item) => item.case)
  }, [])

  const chooseAnswer = async (option) => {
    if (isCoaching) return
    const correct = option === activeStep.answer
    setAnswers({ ...answers, [activeStep.id]: { choice: option, correct } })
    setInstructorFeedback(correct ? activeStep.consequence : activeStep.review)
    setNotice(correct ? activeStep.note : `Not quite. Safer move: ${activeStep.answer}`)
    setIsCoaching(true)
    const response = await askClinicalStepFeedback({
      caseFile: activeCase,
      step: activeStep,
      selectedOption: option,
      correct,
      displayedVitals,
    })
    setInstructorFeedback(response.text || `${correct ? activeStep.consequence : activeStep.review}${response.error ? ` Local model unavailable: ${response.error}` : ''}`)
    setIsCoaching(false)
  }

  const nextStep = () => {
    if (stepIndex >= clinicalSteps.length - 1) {
      if (!resultRecorded) {
        recordClinicalResult(activeCase.id, safetyScore)
        setResultRecorded(true)
      }
      setShowDebrief(true)
      setNotice('Clinical station complete. Patient dossier progress updated from this result.')
      return
    }
    setStepIndex((current) => (current + 1) % clinicalSteps.length)
    setInstructorFeedback('')
    setNotice('Read the patient context, then choose the safest next clinical move.')
  }

  const resetSession = () => {
    setStepIndex(0)
    setAnswers({})
    setShowDebrief(false)
    setResultRecorded(false)
    setInstructorFeedback('')
    setNotice('Session reset. Start again from the primary survey.')
  }

  return (
    <div className="clinic-sim-container">
      <main className="clinic-content">
        <section className="clinic-hero">
          <div>
            <span className="clinic-eyebrow">Clinical decision simulator</span>
            <h1>Clinical Room</h1>
            <p>Move through patient assessment, red flags, treatment priorities, and reassessment in a supervised learning flow.</p>
          </div>
          <div className="clinic-score-card">
            <span>Safety score</span>
            <strong>{score}/{clinicalSteps.length}</strong>
            <small>{completedSteps} stage{completedSteps === 1 ? '' : 's'} completed</small>
            <button type="button" onClick={resetSession}>Reset session</button>
          </div>
        </section>

        <section className="clinic-layout">
          <div className="clinic-left">
            <section className="clinic-card" aria-label="Clinical schedule">
              <div className="clinic-section-title">
                <Icon name="calendar" />
                <h2>Clinic Schedule</h2>
              </div>
              <div className="clinic-timeline">
                {activePatients.map((item) => (
                  <button className={`clinic-timeline-item ${item.caseId === selectedScheduleId ? 'active' : ''}`} data-color={item.case.color} type="button" onClick={() => {
                    setSelectedScheduleId(item.caseId)
                    setNotice(`${item.case.patient}: ${item.station}.`)
                  }}>
                    <span className="clinic-timeline-dot"></span>
                    <span className="clinic-timeline-time">{item.time}</span>
                    <strong>{item.case.patient}</strong>
                    <span>{item.station} - {item.case.location}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="clinic-card" aria-label="Clinical decision prompt">
              <div className="clinic-section-title">
                <Icon name="pulse" />
                <h2>{showDebrief ? 'Clinical Debrief' : 'Live Assessment'}</h2>
              </div>
              <div className="clinic-brief">
                <span>{activeCase.system} - {activeCase.priority}</span>
                <h3>{activeCase.title}</h3>
                <p>{activeCase.presentation}</p>
              </div>
              {showDebrief ? (
                <div className="clinic-debrief">
                  <div className="clinic-debrief-score">
                    <span>Safety score</span>
                    <strong>{safetyScore}%</strong>
                    <p>{safetyScore >= 80 ? 'Safe sequence. Next run should focus on speed and handover clarity.' : 'Useful attempt. Retry the station and prioritize danger, escalation, and reassessment.'}</p>
                  </div>
                  <div className="clinic-debrief-list">
                    {clinicalSteps.map((step, index) => {
                      const answer = answers[step.id]
                      return (
                        <article className={`clinic-debrief-item ${answer?.correct ? 'correct' : 'review'}`}>
                          <span>Stage {index + 1} - {step.skill}</span>
                          <strong>{answer?.correct ? 'Safe move' : 'Needs review'}</strong>
                          <p>{step.review}</p>
                        </article>
                      )
                    })}
                  </div>
                  <button className="clinic-primary-btn" type="button" onClick={resetSession}>Retry clinical station</button>
                </div>
              ) : (
                <div>
                  <div className="clinic-vitals">
                    <div><span>HR</span><strong>{displayedVitals.hr}</strong></div>
                    <div><span>BP</span><strong>{displayedVitals.bp}</strong></div>
                    <div><span>RR</span><strong>{displayedVitals.rr}</strong></div>
                    <div><span>SpO2</span><strong>{displayedVitals.spo2}%</strong></div>
                  </div>
                  <p className={`clinic-vitals-trend ${vitalsTrend.toLowerCase()}`}>Trend: {vitalsTrend}</p>
                  <div className="clinic-step-box">
                    <div className="clinic-step-meta">
                      <span>Step {stepIndex + 1} of {clinicalSteps.length} - {activeStep.skill}</span>
                      <span>{answered ? (activeAnswer?.correct ? 'Correct' : 'Review') : 'Awaiting answer'}</span>
                    </div>
                    <h3>{activeStep.prompt}</h3>
                    <div className="clinic-options">
                      {activeStep.options.map((option) => {
                        const isChosen = answered && option === activeAnswer?.choice
                        const showCorrect = answered && option === activeStep.answer
                        return (
                          <button className={`${showCorrect ? 'correct' : ''} ${isChosen ? 'chosen' : ''}`} type="button" onClick={() => chooseAnswer(option)} disabled={isCoaching}>
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    {answered ? (
                      <div className="clinic-consequence">
                        <strong>{activeAnswer?.correct ? 'Clinical consequence' : 'Safety correction'}</strong>
                        <p>{isCoaching ? 'Clinical instructor is reviewing your choice...' : instructorFeedback}</p>
                      </div>
                    ) : null}
                    <div className="clinic-step-actions">
                      <button className="clinic-primary-btn" type="button" onClick={nextStep} disabled={!answered || isCoaching}>
                        {isCoaching ? 'Reviewing...' : stepIndex >= clinicalSteps.length - 1 ? 'Finish debrief' : 'Next stage'}
                      </button>
                      <p role="status">{notice}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="clinic-right" aria-label="Clinical tools and active patients">
            <section className="clinic-status-card">
              <div className="clinic-status-left">
                <Icon name="heart" />
                <strong>Clinical Status</strong>
              </div>
              <div className="clinic-status-grid">
                <div><span>High acuity</span><strong>3</strong></div>
                <div><span>Needs reassessment</span><strong>2</strong></div>
              </div>
            </section>

            <section className="clinic-card">
              <div className="clinic-section-header">
                <h2>Active Patients</h2>
                <button type="button" onClick={() => setNotice('Active patients are pulled from the shared health case file.')}>View all</button>
              </div>
              <div className="clinic-patient-list">
                {activePatients.map((item) => (
                  <button className={`clinic-patient-item ${item.caseId === selectedScheduleId ? 'active' : ''}`} data-color={item.case.color} type="button" onClick={() => setSelectedScheduleId(item.caseId)}>
                    <span className="clinic-folder-icon"></span>
                    <span>
                      <strong>{item.case.patient}</strong>
                      <small>{item.case.title} - {item.case.location}</small>
                    </span>
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
            </section>

            <section className="clinic-card">
              <div className="clinic-section-header">
                <h2>Clinical Tools</h2>
              </div>
              <div className="clinic-tools-grid">
                {clinicalTools.map((tool) => (
                  <button className={`clinic-tool-btn ${tool.id === activeToolId ? 'active' : ''}`} type="button" onClick={() => {
                    setActiveToolId(tool.id)
                    setNotice(tool.detail)
                  }}>
                    <Icon name={toolIconById[tool.id]} />
                    {tool.title}
                  </button>
                ))}
              </div>
              <div className="clinic-tool-detail">
                <strong>{activeTool.title}</strong>
                <p>{activeTool.detail}</p>
              </div>
            </section>

            <p className="clinic-disclaimer">Educational simulation only. It is not medical advice, diagnosis, or treatment guidance.</p>
          </aside>
        </section>
      </main>
    </div>
  )
}

export function mountHealthClinicalRoomSimulation(container) {
  const app = render(HealthClinicalRoomSimulation)
  container.appendChild(app.root)
  return app.cleanup
}
