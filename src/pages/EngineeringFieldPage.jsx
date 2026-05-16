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

export function mountEngineeringFieldPage({ onBack, onSelect, pageClass = '' }) {
  const root = document.createElement('div')
  root.className = `page eng-page ${pageClass}`
  root.innerHTML = `
    <header class="field-header">
      <button id="btn-back-engineering" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19L5 12L12 5" />
        </svg>
      </button>
      <div class="progress-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot active"></div>
        <div class="dot"></div>
      </div>
      <div class="header-spacer"></div>
    </header>
    <section class="field-title-section">
      <h2 class="field-title">Engineering<br />Specialization</h2>
      <p class="field-subtitle">Choose a specialization to begin your simulations.</p>
    </section>
    <section class="engineering-grid"></section>
  `

  const cardsContainer = root.querySelector('.engineering-grid')
  const listeners = []
  let selected = null

  function renderCards() {
    cardsContainer.innerHTML = SUBFIELDS.map((field, index) => {
      const selectedClass = selected === field.id ? 'selected' : ''
      return `
      <button id="card-${field.id}" class="engineering-card ${selectedClass}" style="--card-bg:${field.color}; animation-delay:${index * 0.05}s;">
        <svg class="card-bg-scribble" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M10,80 Q30,60 50,40 T90,20" stroke="rgba(255,255,255,0.4)" stroke-width="8" fill="none" stroke-linecap="round" />
          <path d="M10,95 Q40,70 70,50 T100,40" stroke="rgba(255,255,255,0.3)" stroke-width="6" fill="none" stroke-linecap="round" />
        </svg>
        <div class="card-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h3 class="engineering-card-label">${field.label}</h3>
        <div class="card-cutout-arrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="19" x2="19" y2="5"></line>
            <polyline points="9 5 19 5 19 15"></polyline>
          </svg>
        </div>
        ${selected === field.id ? `
          <div class="eng-card-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ` : ''}
      </button>
      `
    }).join('')

    SUBFIELDS.forEach((field) => {
      const button = cardsContainer.querySelector(`#card-${field.id}`)
      if (!button) return
      const handler = () => {
        selected = field.id
        renderCards()
        setTimeout(() => onSelect(field.id), 350)
      }
      button.addEventListener('click', handler)
      listeners.push({ element: button, handler })
    })
  }

  const backButton = root.querySelector('#btn-back-engineering')
  backButton.addEventListener('click', onBack)
  listeners.push({ element: backButton, handler: onBack })

  renderCards()

  function cleanup() {
    listeners.forEach(({ element, handler }) => element.removeEventListener('click', handler))
  }

  return { root, cleanup }
}
