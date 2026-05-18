import { render, useMemo, useState } from '../../utils/react-lite.js'
import { healthCases } from './healthData.js'
import './HealthCasesSimulation.css'

const tabs = [
  { id: 'all', label: 'All patients' },
  { id: 'critical', label: 'Critical' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]
const HEALTH_PROGRESS_KEY = 'simlit_health_case_progress'

function Icon({ name }) {
  const paths = {
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1" /><path d="M3 14h4l2-4 4 8 2-4h6" /><path d="M18 16 12 22l-3-3" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
    filter: <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    pulse: <path d="M3 12h4l2-7 5 14 3-7h4" />,
  }

  return (
    <svg className="health-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.file}
    </svg>
  )
}

function priorityLabel(priority) {
  return priority === 'Critical' ? 'Critical' : priority
}

function readProgressMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(HEALTH_PROGRESS_KEY)) || {}
    return Object.fromEntries(healthCases.map((patientCase) => [patientCase.id, saved[patientCase.id] ?? patientCase.progress]))
  } catch {
    return Object.fromEntries(healthCases.map((patientCase) => [patientCase.id, patientCase.progress]))
  }
}

function getProgressLabel(progress) {
  if (progress >= 100) return 'Ready for review'
  if (progress >= 70) return 'Care plan strong'
  if (progress >= 35) return 'Assessment underway'
  if (progress > 0) return 'Started'
  return 'Not started'
}

function getCompletedTaskCount(progress, totalTasks) {
  if (!totalTasks) return 0
  return Math.min(totalTasks, Math.floor((progress / 100) * totalTasks))
}

export default function HealthCasesSimulation() {
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [systemFilter, setSystemFilter] = useState('all')
  const [progressById, setProgressById] = useState(readProgressMap)
  const [selectedId, setSelectedId] = useState(healthCases[0].id)
  const [notice, setNotice] = useState('Select a patient dossier, complete the next task, and reassess the plan.')

  const selectedCase = healthCases.find((patientCase) => patientCase.id === selectedId) || healthCases[0]
  const completedCount = Object.values(progressById).filter((value) => value >= 100).length
  const averageProgress = Math.round(Object.values(progressById).reduce((sum, value) => sum + value, 0) / healthCases.length)
  const systems = ['all', ...Array.from(new Set(healthCases.map((patientCase) => patientCase.system)))]

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return healthCases.filter((patientCase) => {
      const progress = progressById[patientCase.id] || 0
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'critical' && patientCase.priority === 'Critical') ||
        (activeTab === 'in-progress' && progress > 0 && progress < 100) ||
        (activeTab === 'completed' && progress >= 100)
      const matchesSystem = systemFilter === 'all' || patientCase.system === systemFilter
      const haystack = `${patientCase.title} ${patientCase.patient} ${patientCase.system} ${patientCase.presentation}`.toLowerCase()
      return matchesTab && matchesSystem && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [activeTab, progressById, query, systemFilter])

  const completeTask = () => {
    const current = progressById[selectedCase.id] || 0
    const next = Math.min(100, current + 20)
    const nextProgress = { ...progressById, [selectedCase.id]: next }
    setProgressById(nextProgress)
    localStorage.setItem(HEALTH_PROGRESS_KEY, JSON.stringify(nextProgress))
    setNotice(next >= 100 ? `${selectedCase.title} dossier completed.` : `${selectedCase.title} moved to ${next}%. Next: ${selectedCase.nextStep}`)
  }

  const resetCase = () => {
    const nextProgress = { ...progressById, [selectedCase.id]: selectedCase.progress }
    setProgressById(nextProgress)
    localStorage.setItem(HEALTH_PROGRESS_KEY, JSON.stringify(nextProgress))
    setNotice(`${selectedCase.title} reset to the starting scenario.`)
  }

  return (
    <div className="health-sim-container">
      <main className="health-main">
        <header className="health-header">
          <div>
            <span className="health-eyebrow">Patient dossier studio</span>
            <h1>Health Cases</h1>
            <p>Practice clinical reasoning with patient presentations, vital signs, priorities, and next-step decisions.</p>
          </div>
          <div className="health-header-stats">
            <div><strong>{healthCases.length}</strong><span>dossiers</span></div>
            <div><strong>{averageProgress}%</strong><span>average progress</span></div>
            <div><strong>{completedCount}</strong><span>completed</span></div>
          </div>
        </header>

        <section className="health-controls" aria-label="Patient case filters">
          <label className="health-search">
            <Icon name="search" />
            <span className="sr-only">Search patient dossiers</span>
            <input value={query} onInput={(event) => setQuery(event.target.value)} placeholder="Search patient, system, or presentation" />
          </label>
          <div className="health-tabs">
            {tabs.map((tab) => (
              <button className={`health-tab ${activeTab === tab.id ? 'active' : ''}`} type="button" onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
          <label className="health-filter">
            <Icon name="filter" />
            <span className="sr-only">Filter by body system</span>
            <select value={systemFilter} onChange={(event) => setSystemFilter(event.target.value)}>
              {systems.map((system) => <option value={system}>{system === 'all' ? 'All systems' : system}</option>)}
            </select>
          </label>
        </section>
        <p className="health-notice health-page-notice" role="status">{notice}</p>

        <section className="health-workspace">
          <div className="health-grid" aria-label="Available patient dossiers">
            {filteredCases.map((patientCase) => {
              const progress = progressById[patientCase.id] || 0
              const completedTasks = getCompletedTaskCount(progress, patientCase.tasks.length)
              const isSelected = patientCase.id === selectedId
              return (
                <article className={`health-dossier ${isSelected ? 'selected' : ''}`} data-color={patientCase.color}>
                  <button className="health-dossier-main" type="button" onClick={() => setSelectedId(patientCase.id)}>
                    <span className="health-dossier-top">
                      <span className="health-dossier-icon"><Icon name={progress >= 100 ? 'check' : 'file'} /></span>
                      <span className={`health-priority ${patientCase.priority.toLowerCase()}`}>{priorityLabel(patientCase.priority)}</span>
                    </span>
                    <strong>{patientCase.title}</strong>
                    <span>{patientCase.patient}</span>
                    <p>{patientCase.presentation}</p>
                    <span className="health-progress-label">{getProgressLabel(progress)} - {completedTasks}/{patientCase.tasks.length} tasks</span>
                    <span className="health-dossier-footer">
                      <span
                        className="health-progress-bar"
                        role="progressbar"
                        aria-label={`${patientCase.title} progress`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={progress}
                      >
                        <span style={{ width: `${progress}%` }}></span>
                      </span>
                      <span>{progress}%</span>
                    </span>
                  </button>
                </article>
              )
            })}
          </div>

          <aside className="health-panel" aria-label="Selected patient details">
            {(() => {
              const selectedProgress = progressById[selectedCase.id] || 0
              const completedTasks = getCompletedTaskCount(selectedProgress, selectedCase.tasks.length)
              return (
                <>
                  <div className="health-panel-header">
                    <span>{selectedCase.system}</span>
                    <strong>{selectedCase.priority}</strong>
                  </div>
                  <div className="health-panel-progress">
                    <span>{getProgressLabel(selectedProgress)}</span>
                    <div
                      className="health-progress-bar"
                      role="progressbar"
                      aria-label={`${selectedCase.title} selected patient progress`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={selectedProgress}
                    >
                      <span style={{ width: `${selectedProgress}%` }}></span>
                    </div>
                    <small>{completedTasks}/{selectedCase.tasks.length} clinical tasks complete</small>
                  </div>
                  <h2>{selectedCase.title}</h2>
                  <p className="health-patient">{selectedCase.patient} - {selectedCase.location}</p>
                  <div className="health-vitals">
                    <div><span>HR</span><strong>{selectedCase.vitals.hr}</strong></div>
                    <div><span>BP</span><strong>{selectedCase.vitals.bp}</strong></div>
                    <div><span>RR</span><strong>{selectedCase.vitals.rr}</strong></div>
                    <div><span>SpO2</span><strong>{selectedCase.vitals.spo2}%</strong></div>
                    <div><span>Temp</span><strong>{selectedCase.vitals.temp}</strong></div>
                  </div>
                  <div className="health-detail-block">
                    <h3>Clinical focus</h3>
                    <p>{selectedCase.focus}</p>
                  </div>
                  <div className="health-detail-block">
                    <h3>Next step</h3>
                    <p>{selectedCase.nextStep}</p>
                  </div>
                  <div className="health-task-list">
                    <h3>Simulation tasks</h3>
                    {selectedCase.tasks.map((task, index) => (
                      <div className={`health-task-row ${index < completedTasks ? 'complete' : ''}`}>
                        <span>{index + 1}</span>
                        <p>{task}</p>
                      </div>
                    ))}
                  </div>
                  <div className="health-panel-actions">
                    <button className="health-primary-btn" type="button" onClick={completeTask}>Complete next task</button>
                    <button className="health-secondary-btn" type="button" onClick={resetCase}>Reset dossier</button>
                  </div>
                  <p className="health-disclaimer">Educational simulation only. It is not medical advice or a substitute for clinical supervision.</p>
                </>
              )
            })()}
          </aside>
        </section>
      </main>
    </div>
  )
}

export function mountHealthCasesSimulation(container) {
  const app = render(HealthCasesSimulation)
  container.appendChild(app.root)
  return app.cleanup
}
