import { FIELD_TOPICS, DIFFICULTY_COLOR } from '../data/topics.js'
import './SimulationSelectPage.css'

export function mountSimulationSelectPage({ subfieldId, onBack, onSelect, pageClass = '' }) {
  const fieldData = FIELD_TOPICS[subfieldId] || { label: 'Topics', color: '#f5ede0', topics: [] }
  const { label, topics } = fieldData

  const root = document.createElement('div')
  root.className = `page sim-select-page ${pageClass}`
  root.innerHTML = `
    <header class="field-header">
      <button id="btn-back-sim-select" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" /><path d="M12 19L5 12L12 5" />
        </svg>
      </button>
      <div class="progress-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot active"></div>
      </div>
      <div class="header-spacer"></div>
    </header>
    <section class="sim-select-title-section">
      <div class="sim-field-badge">${label}</div>
      <h2 class="sim-select-title">Pick a simulation</h2>
      <p class="sim-select-subtitle">Choose what you'd like to explore and interact with.</p>
    </section>
    <section class="sim-topic-list"></section>
  `

  const listContainer = root.querySelector('.sim-topic-list')
  const listeners = []

  listContainer.innerHTML = topics.map((topic, index) => {
    const diff = DIFFICULTY_COLOR[topic.difficulty] || DIFFICULTY_COLOR.Beginner
    return `
      <button id="topic-${topic.id}" class="sim-topic-card" style="animation-delay:${index * 0.07}s;">
        <div class="topic-emoji-wrap">${topic.emoji}</div>
        <div class="topic-info">
          <div class="topic-top-row">
            <h3 class="topic-label">${topic.label}</h3>
            ${topic.implemented ? '' : '<span class="topic-soon-badge">Soon</span>'}
          </div>
          <p class="topic-desc">${topic.desc}</p>
          <span class="topic-difficulty" style="background:${diff.bg}; color:${diff.text};">${topic.difficulty}</span>
        </div>
        <div class="topic-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12H19"/><path d="M12 5L19 12L12 19"/>
          </svg>
        </div>
      </button>
    `
  }).join('')

  topics.forEach(topic => {
    const button = root.querySelector(`#topic-${topic.id}`)
    if (!button) return
    const handler = () => onSelect(topic.id)
    button.addEventListener('click', handler)
    listeners.push({ element: button, handler })
  })

  const backButton = root.querySelector('#btn-back-sim-select')
  backButton.addEventListener('click', onBack)
  listeners.push({ element: backButton, handler: onBack })

  function cleanup() {
    listeners.forEach(({ element, handler }) => element.removeEventListener('click', handler))
  }

  return { root, cleanup }
}
