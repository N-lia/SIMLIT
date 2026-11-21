import { iconSvg } from '../utils/icons.js'
import { escapeHtml } from '../utils/dom.js'
import './AppNav.css'

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'grid' },
  { id: 'sims', label: 'Simulations', short: 'Labs', icon: 'atom' },
  { id: 'cards', label: 'Study cards', short: 'Cards', icon: 'book' },
  { id: 'notes', label: 'Notes', icon: 'edit' },
  { id: 'tutor', label: 'Tutor', icon: 'sparkles' },
]

const SUBJECT_LABELS = { eng: 'Engineering', law: 'Law', med: 'Health', cs: 'Computing' }

/**
 * Persistent app navigation: a top bar on desktop and a bottom tab bar on phones.
 * `onNavigate(id)` receives one of the NAV_ITEMS ids.
 */
export function createAppNav({ active, profile, subject, onNavigate }) {
  const nav = document.createElement('nav')
  nav.className = 'app-nav'
  nav.setAttribute('aria-label', 'Main')

  const initial = escapeHtml((profile?.name || '?').trim().charAt(0).toUpperCase() || '?')
  const subjectLabel = SUBJECT_LABELS[subject] || ''

  nav.innerHTML = `
    <div class="app-nav-inner">
      <button type="button" class="app-nav-logo" data-nav="home" aria-label="SIMLIT home">simlit</button>
      ${subjectLabel ? `<span class="app-nav-subject">${escapeHtml(subjectLabel)}</span>` : ''}
      <div class="app-nav-links">
        ${NAV_ITEMS.map(item => `
          <button type="button" class="app-nav-link${item.id === active ? ' is-active' : ''}" data-nav="${item.id}"${item.id === active ? ' aria-current="page"' : ''}>
            ${iconSvg(item.icon, 'app-icon app-nav-icon')}
            <span class="app-nav-label-long">${item.label}</span>
            <span class="app-nav-label-short">${item.short || item.label}</span>
          </button>`).join('')}
      </div>
      <button type="button" class="app-nav-avatar" data-nav="home" aria-label="Your profile">${initial}</button>
    </div>
  `

  nav.addEventListener('click', (event) => {
    const target = event.target.closest('[data-nav]')
    if (!target) return
    const id = target.dataset.nav
    if (id === active && id !== 'tutor') return
    onNavigate(id)
  })

  return nav
}
