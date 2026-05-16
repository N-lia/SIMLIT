import { useState } from 'react'
import computerImg from '../assets/computer-vintage.png'
import engineeringImg from '../assets/engineering-vintage.png'
import lawImg from '../assets/law-vintage.png'
import medicineImg from '../assets/medicine-vintage.png'
import './FieldOfStudyPage.css'

const FIELDS = [
  {
    id: 'cs',
    label: 'Computer Science',
    tagline: 'Code the future.',
    color: '#e85d2a',
    image: computerImg,
  },
  {
    id: 'eng',
    label: 'Engineering',
    tagline: 'Build. Innovate. Solve.',
    color: '#f5ede0',
    textDark: true,
    image: engineeringImg,
  },
  {
    id: 'law',
    label: 'Law',
    tagline: 'Understand rights. Defend justice.',
    color: '#faf5ee',
    textDark: true,
    image: lawImg,
  },
  {
    id: 'med',
    label: 'Medicine',
    tagline: 'Heal lives. Improve futures.',
    color: '#e85d2a',
    image: medicineImg,
  },
]

function FieldOfStudyPage({ onBack, onSelect, pageClass = '' }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (fieldId) => {
    setSelected(fieldId)
    if (onSelect) {
      setTimeout(() => onSelect(fieldId), 350)
    }
  }

  return (
    <div className={`page field-page ${pageClass}`}>
      {/* Header */}
      <header className="field-header">
        <button id="btn-back-field" className="icon-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19L5 12L12 5" />
          </svg>
        </button>

        <div className="progress-dots">
          <div className="dot active"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>

        <div className="header-spacer"></div>
      </header>

      {/* Title */}
      <section className="field-title-section">
        <h2 className="field-title">
          What's your field<br />of study?
        </h2>
        <p className="field-subtitle">
          Choose your primary focus<br />to get personalized learning.
        </p>
      </section>

      {/* Cards */}
      <section className="field-cards">
        {FIELDS.map((field, index) => (
          <button
            key={field.id}
            id={`card-${field.id}`}
            className={`field-card ${field.textDark ? 'dark-text' : ''} ${selected === field.id ? 'selected' : ''}`}
            style={{
              '--card-color': field.color,
              animationDelay: `${index * 0.08}s`,
            }}
            onClick={() => handleSelect(field.id)}
          >
            <div className="card-top-content">
              <div className="card-content">
                <h3 className="card-label">{field.label}</h3>
                <p className="card-tagline">{field.tagline}</p>
              </div>
              <div className="card-image-wrapper">
                <img src={field.image} alt={field.label} className="card-image" draggable="false" />
              </div>
              <div className="card-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12H19" />
                  <path d="M12 5L19 12L12 19" />
                </svg>
              </div>
            </div>

            {/* Selection indicator */}
            {selected === field.id && (
              <div className="card-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

export default FieldOfStudyPage
