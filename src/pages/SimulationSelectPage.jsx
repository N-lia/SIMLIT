import { FIELD_TOPICS } from '../data/topics.js'
import { iconSvg } from '../utils/icons.js'
import './SimulationSelectPage.css'

export function mountSimulationSelectPage({ subfieldId, onBack, onSelect, onViewCards, onOpenNotes, onOpenProfile, pageClass = '' }) {
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
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="btn-my-notes-select" class="btn-pill outline" style="padding: 6px 12px; font-size: 14px;">My Notes</button>
        <button id="btn-profile-select" class="icon-btn" style="border: 1.5px solid var(--line-soft); border-radius: 50%; padding: 4px; color: var(--ink);" aria-label="Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </header>
    <section class="sim-select-title-section">
      <div class="sim-field-badge">${label}</div>
      <div class="sim-select-title-row">
        <h2 class="sim-select-title">Pick a simulation</h2>
        <button id="btn-view-cards" class="btn-pill outline tarot-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Study Cards
        </button>
      </div>
      <p class="sim-select-subtitle">Choose what you'd like to explore and interact with.</p>
    </section>
    <section class="sim-topic-list"></section>
  `

  const listContainer = root.querySelector('.sim-topic-list')
  const listeners = []

  listContainer.innerHTML = topics.map((topic, index) => {
    return `
      <button id="topic-${topic.id}" class="sim-topic-card" style="animation-delay:${index * 0.07}s;">
        <div class="topic-emoji-wrap">${iconSvg(topic.icon)}</div>
        <div class="topic-info">
          <div class="topic-top-row">
            <h3 class="topic-label">${topic.label}</h3>
            ${topic.implemented ? '' : '<span class="topic-soon-badge">Soon</span>'}
          </div>
          <p class="topic-desc">${topic.desc}</p>
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

  const cardsButton = root.querySelector('#btn-view-cards')
  if (cardsButton && onViewCards) {
    cardsButton.addEventListener('click', onViewCards)
    listeners.push({ element: cardsButton, handler: onViewCards })
  }

  const notesButton = root.querySelector('#btn-my-notes-select')
  if (notesButton && onOpenNotes) {
    notesButton.addEventListener('click', onOpenNotes)
    listeners.push({ element: notesButton, handler: onOpenNotes })
  }

  const profileButton = root.querySelector('#btn-profile-select')
  if (profileButton && onOpenProfile) {
    profileButton.addEventListener('click', onOpenProfile)
    listeners.push({ element: profileButton, handler: onOpenProfile })
  }

  function cleanup() {
    listeners.forEach(({ element, handler }) => element.removeEventListener('click', handler))
  }

  return { root, cleanup }
}
