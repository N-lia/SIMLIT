import { FIELD_TOPICS, DIFFICULTY_COLOR } from '../data/topics'
import './SimulationSelectPage.css'

function SimulationSelectPage({ subfieldId, onBack, onSelect, pageClass = '' }) {
  const fieldData = FIELD_TOPICS[subfieldId] || { label: 'Topics', color: '#f5ede0', topics: [] }
  const { label, topics } = fieldData

  return (
    <div className={`page sim-select-page ${pageClass}`}>
      {/* Header */}
      <header className="field-header">
        <button id="btn-back-sim-select" className="icon-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19L5 12L12 5" />
          </svg>
        </button>
        <div className="progress-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot active"></div>
        </div>
        <div className="header-spacer"></div>
      </header>

      {/* Title */}
      <section className="sim-select-title-section">
        <div className="sim-field-badge">{label}</div>
        <h2 className="sim-select-title">Pick a simulation</h2>
        <p className="sim-select-subtitle">Choose what you'd like to explore and interact with.</p>
      </section>

      {/* Topic cards */}
      <section className="sim-topic-list">
        {topics.map((topic, index) => {
          const diff = DIFFICULTY_COLOR[topic.difficulty] || DIFFICULTY_COLOR.Beginner
          return (
            <button
              key={topic.id}
              id={`topic-${topic.id}`}
              className="sim-topic-card"
              style={{ animationDelay: `${index * 0.07}s` }}
              onClick={() => onSelect(topic.id)}
            >
              <div className="topic-emoji-wrap">{topic.emoji}</div>
              <div className="topic-info">
                <div className="topic-top-row">
                  <h3 className="topic-label">{topic.label}</h3>
                  {!topic.implemented && (
                    <span className="topic-soon-badge">Soon</span>
                  )}
                </div>
                <p className="topic-desc">{topic.desc}</p>
                <span
                  className="topic-difficulty"
                  style={{ background: diff.bg, color: diff.text }}
                >
                  {topic.difficulty}
                </span>
              </div>
              <div className="topic-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12H19"/><path d="M12 5L19 12L12 19"/>
                </svg>
              </div>
            </button>
          )
        })}
      </section>
    </div>
  )
}

export default SimulationSelectPage
