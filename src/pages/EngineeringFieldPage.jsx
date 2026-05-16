import { useState } from 'react'
import './EngineeringFieldPage.css'

const SUBFIELDS = [
  { id: 'statics',  label: 'Statics',               color: '#fdf2bc' },
  { id: 'dynamics', label: 'Dynamics',               color: '#d3e8e1' },
  { id: 'fluid',    label: 'Fluid',                  color: '#dfccf1' },
  { id: 'thermo',   label: 'Thermodynamics',         color: '#fbd0e6' },
  { id: 'strength', label: 'Strength of Material',   color: '#d3e8e1' },
  { id: 'circuit',  label: 'Circuit',                color: '#fdf2bc' },
  { id: 'math',     label: 'Mathematics',            color: '#dfccf1' },
]

function EngineeringFieldPage({ onBack, onSelect, pageClass = '' }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (fieldId) => {
    setSelected(fieldId)
    if (onSelect) {
      setTimeout(() => onSelect(fieldId), 350)
    }
  }

  return (
    <div className={`page eng-page ${pageClass}`}>
      {/* Header */}
      <header className="field-header">
        <button id="btn-back-engineering" className="icon-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19L5 12L12 5" />
          </svg>
        </button>

        <div className="progress-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot active"></div>
          <div className="dot"></div>
        </div>

        <div className="header-spacer"></div>
      </header>

      {/* Title */}
      <section className="field-title-section">
        <h2 className="field-title">
          Engineering<br />Specialization
        </h2>
        <p className="field-subtitle">
          Choose a specialization to begin your simulations.
        </p>
      </section>

      {/* Grid of Cards */}
      <section className="engineering-grid">
        {SUBFIELDS.map((field, index) => (
          <button
            key={field.id}
            id={`card-${field.id}`}
            className={`engineering-card ${selected === field.id ? 'selected' : ''}`}
            style={{
              '--card-bg': field.color,
              animationDelay: `${index * 0.05}s`,
            }}
            onClick={() => handleSelect(field.id)}
          >
            {/* Background Scribble */}
            <svg className="card-bg-scribble" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M10,80 Q30,60 50,40 T90,20" stroke="rgba(255,255,255,0.4)" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M10,95 Q40,70 70,50 T100,40" stroke="rgba(255,255,255,0.3)" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>

            {/* Top Left Star Badge */}
            <div className="card-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            {/* Card Label */}
            <h3 className="engineering-card-label">{field.label}</h3>

            {/* Right Arrow Cutout */}
            <div className="card-cutout-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="19" x2="19" y2="5"></line>
                <polyline points="9 5 19 5 19 15"></polyline>
              </svg>
            </div>

            {/* Selection indicator */}
            {selected === field.id && (
              <div className="eng-card-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </section>
    </div>
  )
}

export default EngineeringFieldPage
