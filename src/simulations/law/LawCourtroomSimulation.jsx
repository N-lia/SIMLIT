import { render, useMemo, useState } from '../../utils/react-lite.js'
import { courtroomSchedule, courtroomSteps, courtroomTools, lawCases } from './lawData.js'
import './LawCourtroomSimulation.css'

function Icon({ name }) {
  const paths = {
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
    gavel: <><path d="m14 13-4 4-4-4 4-4 4 4z" /><path d="m14 13 6-6" /><path d="m17 4 3 3" /><path d="m6 15-4 4" /><path d="M22 22H14" /></>,
    folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
    message: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" /></>,
    document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
    check: <path d="M20 6 9 17l-5-5" />,
    people: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    quote: <><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h1" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h1" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
  }

  return (
    <svg className="court-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.folder}
    </svg>
  )
}

const toolIconById = {
  'objection-guide': 'message',
  'evidence-rules': 'document',
  'procedure-checklist': 'check',
  'courtroom-etiquette': 'people',
  'citations-helper': 'quote',
  'full-toolkit': 'folder',
}

export default function LawCourtroomSimulation() {
  const [selectedScheduleId, setSelectedScheduleId] = useState(courtroomSchedule[0].caseId)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [activeToolId, setActiveToolId] = useState(courtroomTools[0].id)
  const [notice, setNotice] = useState('Court is in session. Pick the best procedural move for each stage.')

  const activeSchedule = courtroomSchedule.find((item) => item.caseId === selectedScheduleId) || courtroomSchedule[0]
  const activeCase = lawCases.find((lawCase) => lawCase.id === activeSchedule.caseId) || lawCases[0]
  const activeStep = courtroomSteps[stepIndex]
  const activeTool = courtroomTools.find((tool) => tool.id === activeToolId) || courtroomTools[0]
  const score = Object.values(answers).filter(Boolean).length
  const answered = Object.prototype.hasOwnProperty.call(answers, activeStep.id)

  const activeCases = useMemo(() => {
    return courtroomSchedule.map((item) => ({
      ...item,
      case: lawCases.find((lawCase) => lawCase.id === item.caseId),
    })).filter((item) => item.case)
  }, [])

  const chooseAnswer = (option) => {
    const correct = option === activeStep.answer
    setAnswers({ ...answers, [activeStep.id]: correct })
    setNotice(correct ? activeStep.note : `Not quite. Better move: ${activeStep.answer}`)
  }

  const nextStep = () => {
    setStepIndex((current) => (current + 1) % courtroomSteps.length)
    setNotice('Read the facts, then choose the next procedural move.')
  }

  const resetSession = () => {
    setStepIndex(0)
    setAnswers({})
    setNotice('Session reset. Start from appearance and build the advocacy sequence again.')
  }

  return (
    <div className="court-sim-container">
      <header className="court-top-header">
        <button className="court-icon-btn" type="button" aria-label="Open courtroom menu" onClick={() => setNotice('Menu placeholder: this session focuses on courtroom practice.')}>
          <Icon name="menu" />
        </button>

        <div className="court-logo">
          <div className="court-logo-icon"><Icon name="gavel" /></div>
          <div className="court-logo-text">
            <h2>Legal Simulator</h2>
            <span>Nigerian Law Training</span>
          </div>
        </div>

        <button className="court-notif" type="button" aria-label="Show courtroom notifications" onClick={() => setNotice('Three reminders: confirm appearance, object with reasons, and cite the record.')}>
          <Icon name="bell" />
          <span className="court-notif-badge">3</span>
        </button>
      </header>

      <main className="court-content">
        <section className="court-hero">
          <div className="court-title-area">
            <span className="court-eyebrow">Advocacy simulator</span>
            <h1>Courtroom</h1>
            <p>Present a Nigerian courtroom matter, handle objections, and connect procedure to the case file.</p>
          </div>
          <div className="court-score-card">
            <span>Procedure score</span>
            <strong>{score}/{courtroomSteps.length}</strong>
            <button type="button" onClick={resetSession}>Reset session</button>
          </div>
        </section>

        <section className="court-layout">
          <div className="court-left">
            <section className="court-schedule-card" aria-label="Today's courtroom schedule">
              <div className="court-section-title">
                <Icon name="calendar" />
                <h2>Today's Schedule</h2>
              </div>
              <div className="court-timeline">
                {activeCases.map((item) => (
                  <button
                    className={`court-timeline-item ${item.caseId === selectedScheduleId ? 'active' : ''}`}
                    data-color={item.case.color}
                    type="button"
                    onClick={() => {
                      setSelectedScheduleId(item.caseId)
                      setNotice(`${item.case.parties}: ${item.hearing}.`)
                    }}
                  >
                    <span className="court-timeline-dot"></span>
                    <span className="court-timeline-time">{item.time}</span>
                    <strong>{item.case.parties}</strong>
                    <span>{item.hearing} - {item.case.room}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="court-simulation-card" aria-label="Courtroom procedure prompt">
              <div className="court-section-title">
                <Icon name="gavel" />
                <h2>Live Procedure</h2>
              </div>
              <div className="court-case-brief">
                <span>{activeCase.jurisdiction}</span>
                <h3>{activeCase.parties}</h3>
                <p>{activeCase.facts}</p>
              </div>
              <div className="court-step-box">
                <div className="court-step-meta">
                  <span>Step {stepIndex + 1} of {courtroomSteps.length}</span>
                  <span>{answered ? (answers[activeStep.id] ? 'Correct' : 'Review') : 'Awaiting answer'}</span>
                </div>
                <h3>{activeStep.prompt}</h3>
                <div className="court-options">
                  {activeStep.options.map((option) => {
                    const isChosen = answered && option === activeStep.answer && answers[activeStep.id]
                    const showCorrect = answered && option === activeStep.answer
                    return (
                      <button
                        className={`${showCorrect ? 'correct' : ''} ${isChosen ? 'chosen' : ''}`}
                        type="button"
                        onClick={() => chooseAnswer(option)}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <div className="court-step-actions">
                  <button className="court-primary-btn" type="button" onClick={nextStep}>Next stage</button>
                  <p role="status">{notice}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="court-right" aria-label="Courtroom context and tools">
            <section className="court-status-card">
              <div className="court-status-left">
                <Icon name="gavel" />
                <strong>Court Status</strong>
              </div>
              <div className="court-status-right">
                <div><span>Active hearings</span><strong>2</strong></div>
                <div><span>Upcoming</span><strong>1</strong></div>
              </div>
            </section>

            <section className="court-cases-card">
              <div className="court-section-header">
                <h2>Active Cases</h2>
                <button type="button" onClick={() => setNotice('All listed matters come from the shared law case file.')}>View all</button>
              </div>
              <div className="court-cases-list">
                {activeCases.map((item) => (
                  <button
                    className={`court-case-item ${item.caseId === selectedScheduleId ? 'active' : ''}`}
                    data-color={item.case.color}
                    type="button"
                    onClick={() => setSelectedScheduleId(item.caseId)}
                  >
                    <span className="court-folder-icon"></span>
                    <span className="court-case-info">
                      <strong>{item.case.parties}</strong>
                      <span>{item.case.type} - {item.case.room}</span>
                    </span>
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
            </section>

            <section className="court-tools-card">
              <div className="court-section-header">
                <h2>Courtroom Tools</h2>
              </div>
              <div className="court-tools-grid">
                {courtroomTools.map((tool) => (
                  <button
                    className={`court-tool-btn ${tool.id === activeToolId ? 'active' : ''}`}
                    type="button"
                    onClick={() => {
                      setActiveToolId(tool.id)
                      setNotice(tool.detail)
                    }}
                  >
                    <Icon name={toolIconById[tool.id]} />
                    {tool.title}
                  </button>
                ))}
              </div>
              <div className="court-tool-detail">
                <strong>{activeTool.title}</strong>
                <p>{activeTool.detail}</p>
              </div>
            </section>

            <p className="court-disclaimer">Training simulation only. It is not legal advice.</p>
          </aside>
        </section>
      </main>
    </div>
  )
}

export function mountLawCourtroomSimulation(container) {
  const app = render(LawCourtroomSimulation)
  container.appendChild(app.root)
  return app.cleanup
}
