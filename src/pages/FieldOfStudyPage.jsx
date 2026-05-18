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

export function mountFieldOfStudyPage({ onBack, onSelect, pageClass = '' }) {
  const root = document.createElement('div')
  root.className = `page field-page ${pageClass}`
  root.innerHTML = `
    <header class="field-header">
      <button id="btn-back-field" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19L5 12L12 5" />
        </svg>
      </button>
      <div class="progress-dots">
        <div class="dot active"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="header-spacer"></div>
    </header>
    <section class="field-title-section">
      <h2 class="field-title">What's your field<br />of study?</h2>
      <p class="field-subtitle">Choose your primary focus<br />to get personalized learning.</p>
    </section>
    <section class="field-cards"></section>
  `

  const cardsContainer = root.querySelector('.field-cards')
  let selected = null
  let timeoutId = null
  const listeners = []

  function renderCards() {
    cardsContainer.innerHTML = FIELDS.map((field, index) => {
      const selectedClass = selected === field.id ? 'selected' : ''
      const darkClass = field.textDark ? 'dark-text' : ''
      return `
        <button id="card-${field.id}" class="field-card ${darkClass} ${selectedClass}" style="--card-color:${field.color}; animation-delay:${index * 0.08}s;">
          <div class="card-top-content">
            <div class="card-content">
              <h3 class="card-label">${field.label}</h3>
              <p class="card-tagline">${field.tagline}</p>
            </div>
            <div class="card-image-wrapper">
              <img src="${field.image}" alt="${field.label}" class="card-image" draggable="false" />
            </div>
            <div class="card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12H19" />
                <path d="M12 5L19 12L12 19" />
              </svg>
            </div>
          </div>
          ${selected === field.id ? `
            <div class="card-check">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ` : ''}
        </button>
      `
    }).join('')

    FIELDS.forEach((field) => {
      const button = cardsContainer.querySelector(`#card-${field.id}`)
      if (!button) return
      const handler = () => {
        selected = field.id
        renderCards()
        window.clearTimeout(timeoutId)
        timeoutId = window.setTimeout(() => onSelect(field.id), 350)
      }
      button.addEventListener('click', handler)
      listeners.push({ element: button, handler })
    })
  }

  const backButton = root.querySelector('#btn-back-field')
  backButton.addEventListener('click', onBack)
  listeners.push({ element: backButton, handler: onBack })

  renderCards()

  function cleanup() {
    window.clearTimeout(timeoutId)
    listeners.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler)
    })
  }

  return { root, cleanup }
}
