import { render, useMemo, useState } from '../../utils/react-lite.js'
import { lawCases } from './lawData.js'
import './LawCasesSimulation.css'

const tabs = [
  { id: 'all', label: 'All cases' },
  { id: 'favourites', label: 'Favourites' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

const navItems = ['Dashboard', 'Cases', 'Progress', 'Library', 'Drafting Lab', 'ADR Room', 'Moot Court', 'Notes']

function Icon({ name }) {
  const paths = {
    scales: <><path d="M12 3v18" /><path d="M8 8l4-5 4 5" /><path d="M6 8v4c0 3 2 6 6 6s6-3 6-6V8" /><path d="M4 10h16" /></>,
    folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
    filter: <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />,
    brief: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    check: <><path d="M20 6 9 17l-5-5" /></>,
    star: <path d="m12 3 2.7 5.45 6.02.87-4.36 4.24 1.03 5.99L12 16.72l-5.39 2.83 1.03-5.99-4.36-4.24 6.02-.87L12 3z" />,
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

export default function LawCasesSimulation() {
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [favourites, setFavourites] = useState(['criminal-trial'])
  const [progressById, setProgressById] = useState(() =>
    Object.fromEntries(lawCases.map((lawCase) => [lawCase.id, lawCase.progress]))
  )
  const [selectedId, setSelectedId] = useState(lawCases[0].id)
  const [notice, setNotice] = useState('Select a case, complete the next task, and watch the curriculum progress update.')

  const selectedCase = lawCases.find((lawCase) => lawCase.id === selectedId) || lawCases[0]
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

  const toggleFavourite = (caseId) => {
    setFavourites((current) =>
      current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId]
    )
  }

  const completeTask = () => {
    const current = progressById[selectedCase.id] || 0
    const next = Math.min(100, current + 20)
    setProgressById({ ...progressById, [selectedCase.id]: next })
    setNotice(
      next >= 100
        ? `${selectedCase.title} completed. The next repetition should focus on speed and confidence.`
        : `${selectedCase.title} moved to ${next}%. Next: ${selectedCase.nextStep}`
    )
  }

  const resetCase = () => {
    setProgressById({ ...progressById, [selectedCase.id]: selectedCase.progress })
    setNotice(`${selectedCase.title} reset to the curriculum starting point.`)
  }

  return (
    <div className="law-sim-container">
      <aside className="law-sidebar" aria-label="Law training navigation">
        <div className="law-logo">
          <div className="law-logo-icon"><Icon name="scales" /></div>
          <div className="law-logo-text">
            <h2>Legal Simulator</h2>
            <span>Nigerian Law Training</span>
          </div>
        </div>

        <nav className="law-nav">
          {navItems.map((item) => (
            <button
              className={`law-nav-item ${item === 'Cases' ? 'active' : ''}`}
              type="button"
              onClick={() => setNotice(`${item} is part of the law training workspace.`)}
            >
              <Icon name={item === 'Cases' ? 'folder' : item === 'Library' ? 'book' : 'brief'} />
              {item}
            </button>
          ))}
        </nav>

        <div className="law-goal">
          <h4>Today's Goal</h4>
          <p>Complete one legal task</p>
          <div className="law-progress-bar" aria-hidden="true">
            <div className="law-progress-fill" style={{ width: `${completedCount > 0 ? 100 : averageProgress}%` }}></div>
          </div>
          <span className="law-goal-text">{completedCount > 0 ? '1/1' : '0/1'} complete</span>
        </div>

        <div className="law-profile">
          <div className="law-avatar"><Icon name="scales" /></div>
          <div className="law-profile-info">
            <strong>A. OLADELE</strong>
            <span>LL.B Student</span>
          </div>
        </div>
      </aside>

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
              const isSelected = lawCase.id === selectedCase.id
              const isFavourite = favourites.includes(lawCase.id)
              return (
                <article className={`law-folder ${isSelected ? 'selected' : ''}`} data-color={lawCase.color}>
                  <button className="law-folder-main" type="button" onClick={() => setSelectedId(lawCase.id)}>
                    <span className="law-folder-tab"></span>
                    <span className="law-folder-body">
                      <span className="law-folder-header">
                        <span className="law-folder-icon"><Icon name={progress >= 100 ? 'check' : 'folder'} /></span>
                        <span className="law-folder-status">{getStatusLabel(progress >= 100 ? 'completed' : lawCase.status)}</span>
                      </span>
                      <strong className="law-folder-title">{lawCase.title}</strong>
                      <span className="law-folder-desc">{lawCase.parties}</span>
                      <span className="law-folder-footer">
                        <span className="law-folder-bar"><span className="law-folder-fill" style={{ width: `${progress}%` }}></span></span>
                        <span className="law-folder-pct">{progress}%</span>
                      </span>
                    </span>
                  </button>
                  <button
                    className={`law-favourite ${isFavourite ? 'active' : ''}`}
                    type="button"
                    aria-label={`${isFavourite ? 'Remove' : 'Add'} ${lawCase.title} favourite`}
                    onClick={() => toggleFavourite(lawCase.id)}
                  >
                    <Icon name="star" />
                  </button>
                </article>
              )
            })}
          </div>

          <aside className="law-case-panel" aria-label="Selected case details">
            <div className="law-panel-header">
              <span className="law-case-type">{selectedCase.type}</span>
              <strong>{progressById[selectedCase.id] || 0}%</strong>
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
                <div className="law-task-row">
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
              <button className="law-primary-btn" type="button" onClick={completeTask}>Complete next task</button>
              <button className="law-secondary-btn" type="button" onClick={resetCase}>Reset case</button>
            </div>
            <p className="law-notice" role="status">{notice}</p>
            <p className="law-disclaimer">Training simulation only. It is not legal advice.</p>
          </aside>
        </section>
      </main>
    </div>
  )
}

export function mountLawCasesSimulation(container) {
  const app = render(LawCasesSimulation)
  container.appendChild(app.root)
  return app.cleanup
}
