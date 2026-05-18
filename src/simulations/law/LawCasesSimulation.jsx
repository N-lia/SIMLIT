import { render, useMemo, useState } from '../../utils/react-lite.js'
import { askLawCaseTutor } from '../../ai/llamaClient.js'
import { lawCases } from './lawData.js'
import './LawCasesSimulation.css'

const tabs = [
  { id: 'all', label: 'All cases' },
  { id: 'favourites', label: 'Favourites' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

const LAW_PROGRESS_KEY = 'simlit_law_case_progress'

function Icon({ name }) {
  const paths = {
    scales: <><path d="M12 3v18" /><path d="M8 8l4-5 4 5" /><path d="M6 8v4c0 3 2 6 6 6s6-3 6-6V8" /><path d="M4 10h16" /></>,
    folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
    filter: <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />,
    brief: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    check: <><path d="M20 6 9 17l-5-5" /></>,
  }

  return (
    <svg className="law-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.folder}
    </svg>
  )
}

function getStatusLabel(status) {
  if (status === 'new') return 'New'
  if (status === 'completed') return 'Completed'
  return 'In progress'
}

function readProgressMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAW_PROGRESS_KEY)) || {}
    return Object.fromEntries(lawCases.map((lawCase) => [lawCase.id, saved[lawCase.id] ?? lawCase.progress]))
  } catch {
    return Object.fromEntries(lawCases.map((lawCase) => [lawCase.id, lawCase.progress]))
  }
}

function getProgressLabel(progress) {
  if (progress >= 100) return 'Ready for review'
  if (progress >= 70) return 'Courtroom ready'
  if (progress >= 35) return 'Building case theory'
  if (progress > 0) return 'Started'
  return 'Not started'
}

function getCompletedTaskCount(progress, totalTasks) {
  if (!totalTasks) return 0
  return Math.min(totalTasks, Math.floor((progress / 100) * totalTasks))
}

function buildDossier(lawCase) {
  return {
    clientPosition: lawCase.parties.includes('Client:')
      ? 'Protect the client, clarify goals, and identify the urgent legal risk before giving advice.'
      : `Prepare the strongest argument for ${lawCase.parties.split(' v. ')[0] || 'your side'} while anticipating the opposing case.`,
    centralIssues: [
      `What facts must be proved in ${lawCase.jurisdiction}?`,
      `Which rule from ${lawCase.statute} controls the outcome?`,
      `What weakness will opposing counsel attack first?`,
    ],
    evidence: [
      'Primary facts from the client or record',
      'Documents, exhibits, or witness testimony that support each issue',
      'Weak or disputed facts that need a response strategy',
    ],
    argumentPlan: [
      'Open with the legal issue and requested outcome.',
      'Tie each material fact to the governing rule.',
      'Answer the opponent before they make their strongest point.',
    ],
  }
}

export default function LawCasesSimulation({ onGoToCourtroom }) {
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [favourites] = useState(['criminal-trial'])
  const [viewMode, setViewMode] = useState('library')
  const [progressById, setProgressById] = useState(readProgressMap)
  const [selectedId, setSelectedId] = useState(lawCases[0].id)
  const [caseTutorResponse, setCaseTutorResponse] = useState('')
  const [isCaseTutorThinking, setIsCaseTutorThinking] = useState(false)
  const [notice, setNotice] = useState('Select a case, complete the next task, and watch the curriculum progress update.')

  const selectedCase = lawCases.find((lawCase) => lawCase.id === selectedId) || lawCases[0]
  const dossier = buildDossier(selectedCase)
  const completedCount = Object.values(progressById).filter((value) => value >= 100).length
  const averageProgress = Math.round(
    Object.values(progressById).reduce((total, value) => total + value, 0) / lawCases.length
  )
  const types = ['all', ...Array.from(new Set(lawCases.map((lawCase) => lawCase.type)))]

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return lawCases.filter((lawCase) => {
      const progress = progressById[lawCase.id] || 0
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'favourites' && favourites.includes(lawCase.id)) ||
        (activeTab === 'in-progress' && progress > 0 && progress < 100) ||
        (activeTab === 'completed' && progress >= 100)
      const matchesType = typeFilter === 'all' || lawCase.type === typeFilter
      const haystack = `${lawCase.title} ${lawCase.type} ${lawCase.parties} ${lawCase.facts}`.toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)

      return matchesTab && matchesType && matchesQuery
    })
  }, [activeTab, favourites, progressById, query, typeFilter])

  const completeTask = () => {
    const current = progressById[selectedCase.id] || 0
    const next = Math.min(100, current + 20)
    const nextProgress = { ...progressById, [selectedCase.id]: next }
    setProgressById(nextProgress)
    localStorage.setItem(LAW_PROGRESS_KEY, JSON.stringify(nextProgress))
    setNotice(
      next >= 100
        ? `${selectedCase.title} completed. The next repetition should focus on speed and confidence.`
        : `${selectedCase.title} moved to ${next}%. Next: ${selectedCase.nextStep}`
    )
  }

  const resetCase = () => {
    const nextProgress = { ...progressById, [selectedCase.id]: selectedCase.progress }
    setProgressById(nextProgress)
    localStorage.setItem(LAW_PROGRESS_KEY, JSON.stringify(nextProgress))
    setNotice(`${selectedCase.title} reset to the curriculum starting point.`)
  }

  const openCaseOverview = (caseId) => {
    setSelectedId(caseId)
    setCaseTutorResponse('')
    setViewMode('overview')
  }

  const askCaseTutor = async () => {
    if (isCaseTutorThinking) return
    const progress = progressById[selectedCase.id] || 0
    setIsCaseTutorThinking(true)
    setCaseTutorResponse('Case tutor is reading the file...')
    const response = await askLawCaseTutor({ caseFile: selectedCase, progress })
    setCaseTutorResponse(
      response.text ||
        `Local case tutor unavailable${response.error ? `: ${response.error}` : ''}. Focus on the issue, rule anchor, strongest facts, weakest facts, and next advocacy task.`
    )
    setIsCaseTutorThinking(false)
  }

  const goToCourtroom = () => {
    if (typeof onGoToCourtroom === 'function') {
      onGoToCourtroom(selectedCase.id)
    } else {
      setNotice(`${selectedCase.title} is ready for courtroom argument.`)
    }
  }

  return (
    <div className="law-sim-container">
      <main className="law-main">
        <header className="law-header">
          <div className="law-title-area">
            <span className="law-eyebrow">Case practice studio</span>
            <h1>Law Cases</h1>
            <p>Practice Nigerian legal reasoning through facts, procedure, evidence, and advocacy choices.</p>
          </div>
          <div className="law-header-stats" aria-label="Case progress summary">
            <div><strong>{lawCases.length}</strong><span>case files</span></div>
            <div><strong>{averageProgress}%</strong><span>average progress</span></div>
            <div><strong>{completedCount}</strong><span>completed</span></div>
          </div>
        </header>

        <section className="law-controls" aria-label="Case filters">
          <label className="law-search">
            <Icon name="search" />
            <span className="sr-only">Search cases</span>
            <input
              value={query}
              onInput={(event) => setQuery(event.target.value)}
              placeholder="Search facts, parties, or topic"
            />
          </label>
          <div className="law-tabs">
            {tabs.map((tab) => (
              <button
                className={`law-tab ${activeTab === tab.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="law-filter">
            <Icon name="filter" />
            <span className="sr-only">Filter by type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              {types.map((type) => <option value={type}>{type === 'all' ? 'All practice areas' : type}</option>)}
            </select>
          </label>
        </section>
        <p className="law-notice law-page-notice" role="status">{notice}</p>

        {viewMode === 'overview' ? (
          <section className="law-dossier-view" aria-label="Full case overview">
            <div className="law-dossier-hero">
              <button className="law-secondary-btn" type="button" onClick={() => setViewMode('library')}>Back to case library</button>
              <span className="law-case-type">{selectedCase.type}</span>
              <h2>{selectedCase.title}</h2>
              <p className="law-parties">{selectedCase.parties}</p>
              <p>{selectedCase.facts}</p>
              <div className="law-dossier-actions">
                <button className="law-primary-btn" type="button" onClick={goToCourtroom}>Go to courtroom</button>
                <button className="law-secondary-btn" type="button" onClick={completeTask}>Mark dossier review done</button>
              </div>
            </div>

            <div className="law-dossier-grid">
              <section className="law-dossier-card">
                <h3>Client position</h3>
                <p>{dossier.clientPosition}</p>
              </section>
              <section className="law-dossier-card">
                <h3>Forum and rule focus</h3>
                <dl className="law-detail-list">
                  <div><dt>Forum</dt><dd>{selectedCase.jurisdiction}</dd></div>
                  <div><dt>Authorities</dt><dd>{selectedCase.statute}</dd></div>
                  <div><dt>Skill target</dt><dd>{selectedCase.skill}</dd></div>
                </dl>
              </section>
              <section className="law-dossier-card">
                <h3>Issues to resolve</h3>
                {dossier.centralIssues.map((issue) => <p className="law-dossier-line">{issue}</p>)}
              </section>
              <section className="law-dossier-card">
                <h3>Evidence map</h3>
                {dossier.evidence.map((item) => <p className="law-dossier-line">{item}</p>)}
              </section>
              <section className="law-dossier-card">
                <h3>Argument plan</h3>
                {dossier.argumentPlan.map((item) => <p className="law-dossier-line">{item}</p>)}
              </section>
              <section className="law-dossier-card">
                <h3>Preparation tasks</h3>
                {selectedCase.tasks.map((task, index) => (
                  <div className="law-task-row">
                    <span>{index + 1}</span>
                    <p>{task}</p>
                  </div>
                ))}
              </section>
            </div>
            <p className="law-disclaimer">Training simulation only. It is not legal advice.</p>
          </section>
        ) : (
        <section className="law-workspace">
          <div className="law-grid" aria-label="Available legal case files">
            {filteredCases.length === 0 ? (
              <div className="law-empty-state">
                <Icon name="folder" />
                <h3>No matching case</h3>
                <p>Try another practice area or clear the search field.</p>
              </div>
            ) : filteredCases.map((lawCase) => {
              const progress = progressById[lawCase.id] || 0
              const completedTasks = getCompletedTaskCount(progress, lawCase.tasks.length)
              const isSelected = lawCase.id === selectedCase.id
              return (
                <article className={`law-folder ${isSelected ? 'selected' : ''}`} data-color={lawCase.color}>
                  <button className="law-folder-main" type="button" onClick={() => openCaseOverview(lawCase.id)}>
                    <span className="law-folder-tab"></span>
                    <span className="law-folder-body">
                      <span className="law-folder-header">
                        <span className="law-folder-icon"><Icon name={progress >= 100 ? 'check' : 'folder'} /></span>
                        <span className="law-folder-status">{getStatusLabel(progress >= 100 ? 'completed' : lawCase.status)}</span>
                      </span>
                      <strong className="law-folder-title">{lawCase.title}</strong>
                      <span className="law-folder-desc">{lawCase.parties}</span>
                      <span className="law-folder-progress-label">{getProgressLabel(progress)} - {completedTasks}/{lawCase.tasks.length} tasks</span>
                      <span className="law-folder-footer">
                        <span
                          className="law-folder-bar"
                          role="progressbar"
                          aria-label={`${lawCase.title} progress`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={progress}
                        >
                          <span className="law-folder-fill" style={{ width: `${progress}%` }}></span>
                        </span>
                        <span className="law-folder-pct">{progress}%</span>
                      </span>
                    </span>
                  </button>
                </article>
              )
            })}
          </div>

          <aside className="law-case-panel" aria-label="Selected case details">
            {(() => {
              const selectedProgress = progressById[selectedCase.id] || 0
              const completedTasks = getCompletedTaskCount(selectedProgress, selectedCase.tasks.length)
              return (
                <>
                  <div className="law-panel-header">
                    <span className="law-case-type">{selectedCase.type}</span>
                    <strong>{selectedProgress}%</strong>
                  </div>
                  <div className="law-panel-progress">
                    <span>{getProgressLabel(selectedProgress)}</span>
                    <div
                      className="law-folder-bar"
                      role="progressbar"
                      aria-label={`${selectedCase.title} selected case progress`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={selectedProgress}
                    >
                      <span className="law-folder-fill" style={{ width: `${selectedProgress}%` }}></span>
                    </div>
                    <small>{completedTasks}/{selectedCase.tasks.length} preparation tasks complete</small>
                  </div>
                  <h2>{selectedCase.title}</h2>
                  <p className="law-parties">{selectedCase.parties}</p>
                  <dl className="law-detail-list">
                    <div><dt>Forum</dt><dd>{selectedCase.jurisdiction}</dd></div>
                    <div><dt>Rule focus</dt><dd>{selectedCase.statute}</dd></div>
                    <div><dt>Skill</dt><dd>{selectedCase.skill}</dd></div>
                  </dl>
                  <div className="law-facts">
                    <h3>Case facts</h3>
                    <p>{selectedCase.facts}</p>
                  </div>
                  <div className="law-task-list">
                    <h3>Simulation tasks</h3>
                    {selectedCase.tasks.map((task, index) => (
                      <div className={`law-task-row ${index < completedTasks ? 'complete' : ''}`}>
                        <span>{index + 1}</span>
                        <p>{task}</p>
                      </div>
                    ))}
                  </div>
                  <div className="law-next-step">
                    <strong>Next move</strong>
                    <p>{selectedCase.nextStep}</p>
                  </div>
                  <div className="law-panel-actions">
                    <button className="law-primary-btn" type="button" onClick={() => setViewMode('overview')}>Open full dossier</button>
                    <button className="law-secondary-btn" type="button" onClick={askCaseTutor} disabled={isCaseTutorThinking}>
                      {isCaseTutorThinking ? 'Asking tutor...' : 'Ask case tutor'}
                    </button>
                    <button className="law-secondary-btn" type="button" onClick={resetCase}>Reset case</button>
                  </div>
                  {caseTutorResponse ? (
                    <div className="law-ai-guidance" role="status">
                      <strong>Case tutor</strong>
                      <p>{caseTutorResponse}</p>
                    </div>
                  ) : null}
                  <p className="law-disclaimer">Training simulation only. It is not legal advice.</p>
                </>
              )
            })()}
          </aside>
        </section>
        )}
      </main>
    </div>
  )
}

export function mountLawCasesSimulation(container, topic, options = {}) {
  const app = render(LawCasesSimulation, {
    onGoToCourtroom: options.onOpenLawCourtroom,
  })
  container.appendChild(app.root)
  return app.cleanup
}
