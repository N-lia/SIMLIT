import { useState } from 'react'
import './BioDataPage.css'

function BioDataPage({ onBack, onComplete, pageClass = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    university: ''
  })
  const [focusedField, setFocusedField] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    // Show success flash then advance to next page
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 1400)
  }

  const isFormValid = formData.name && formData.age && formData.university

  if (submitted) {
    return (
      <div className={`page biodata-page ${pageClass}`}>
        <div className="success-state">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="success-title">You're all set!</h2>
          <p className="success-message">
            Welcome, <strong>{formData.name}</strong>.<br />
            Your personalized learning experience is being prepared.
          </p>
          <div className="success-badge">🎓 Profile created</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`page biodata-page ${pageClass}`}>
      {/* Header */}
      <header className="bio-header">
        <button id="btn-back-biodata" className="icon-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19L5 12L12 5"/>
          </svg>
        </button>

        <div className="progress-dots">
          <div className="dot"></div>
          <div className="dot active"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>

        <div className="header-spacer"></div>
      </header>

      {/* Form Content */}
      <section className="bio-content">
        <h2 className="bio-title">Tell us about<br/>yourself</h2>
        <p className="bio-subtitle">
          Provide your details to personalize<br/>your learning experience.
        </p>

        <form id="biodata-form" className="bio-form" onSubmit={handleSubmit}>
          <div className={`form-group ${focusedField === 'name' ? 'focused' : ''} ${formData.name ? 'filled' : ''}`}>
            <label htmlFor="input-name">Full Name</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                id="input-name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          <div className={`form-group ${focusedField === 'age' ? 'focused' : ''} ${formData.age ? 'filled' : ''}`}>
            <label htmlFor="input-age">Age</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                type="number"
                id="input-age"
                name="age"
                placeholder="21"
                min="10"
                max="100"
                value={formData.age}
                onChange={handleChange}
                onFocus={() => setFocusedField('age')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          <div className={`form-group ${focusedField === 'university' ? 'focused' : ''} ${formData.university ? 'filled' : ''}`}>
            <label htmlFor="input-university">University Name</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <input
                type="text"
                id="input-university"
                name="university"
                placeholder="Stanford University"
                value={formData.university}
                onChange={handleChange}
                onFocus={() => setFocusedField('university')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer className="bio-footer">
        <button
          type="submit"
          form="biodata-form"
          className={`btn-continue ${!isFormValid ? 'disabled' : ''}`}
          disabled={!isFormValid}
        >
          <span>Continue</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12H19"/>
            <path d="M12 5L19 12L12 19"/>
          </svg>
        </button>
      </footer>
    </div>
  )
}

export default BioDataPage
