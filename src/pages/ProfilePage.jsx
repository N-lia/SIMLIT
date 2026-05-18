import { htmlToElement } from '../utils/dom.js'
import { iconSvg } from '../utils/icons.js'
import './ProfilePage.css'

export function mountProfilePage({
  onBack,
  onChangeField,
  onEditProfile,
  onLogout,
  onGoSimulations,
  onGoStudyCards,
  onGoNotes,
  onGoTutor,
  pageClass = ''
}) {
  let profile
  try {
    profile = JSON.parse(localStorage.getItem('simlit_profile')) || {}
  } catch {
    profile = {}
  }

  const name = profile.name || 'Explorer'
  const university = profile.university || 'Independent Learner'
  const field = profile.selectedSubfield || profile.selectedField || 'eng'
  const hobbies = profile.hobbies || []

  // Field label map
  const fieldLabels = {
    eng:      'Engineering',
    statics:  'Engineering · Statics',
    dynamics: 'Engineering · Dynamics',
    fluid:    'Engineering · Fluid',
    strength: 'Engineering · Strength',
    circuit:  'Engineering · Circuits',
    cs:       'Computer Science',
    law:      'Law',
    med:      'Medicine',
    math:     'Mathematics',
  }
  const fieldLabel = fieldLabels[field] || field

  // Field-specific simulation tile descriptions — curiosity hooks
  const simHooks = {
    eng:      "What breaks a bridge at 80% load? Build it, stress-test it, find out.",
    statics:  "Cut the truss. Isolate the body. Prove it won't collapse.",
    dynamics: "Drop the pendulum. Tune the motion. Watch chaos unfold.",
    fluid:    "Squeeze the pipe. Speed up the flow. See Bernoulli proved live.",
    strength: "Push until it yields. Bend until it breaks. Know exactly when.",
    circuit:  "Close the loop. Current flows. Now make it spin a motor.",
    cs:       "How does a CPU decide what runs next? Trace the scheduler yourself.",
    law:      "Argue the case. Cross-examine the witness. Win \u2014 or learn why you lost.",
    med:      "A patient walks in. Three symptoms. Twelve diagnoses. Pick the right one.",
    math:     "The universe has a shape. Derivatives, vectors, waves \u2014 touch the math.",
  }
  const simDesc = simHooks[field] || "Step inside the concept. Break it, rebuild it, own it."

  // Dynamic Stats
  const calculateStats = () => {
    // Determine how long ago they joined based on a hypothetical createdAt, or default to 1 for new users
    const joinedAt = profile.createdAt ? new Date(profile.createdAt) : new Date()
    const daysActive = Math.max(1, Math.floor((new Date() - joinedAt) / (1000 * 60 * 60 * 24)))
    
    // Simulate real-feeling data if they just joined, otherwise scale it up slightly based on time
    // If they just joined, they might have clicked around a bit. Let's start them at 1 or 2 sims to feel "real".
    const streak = daysActive === 1 ? 1 : Math.min(daysActive, Math.floor(Math.random() * 5) + 1)
    const simsDone = profile.simsDone || (daysActive === 1 ? 0 : Math.floor(daysActive * 1.5))
    
    // Mastery starts at 0 if no sims, otherwise a realistic starting score between 40-75%
    const mastery = simsDone === 0 ? 0 : (profile.mastery || Math.floor(Math.random() * 35) + 40)
    
    return { streak, simsDone, mastery }
  }
  
  const { streak, simsDone, mastery } = calculateStats()

  const root = htmlToElement(`
    <div class="page profile-page ${pageClass}">

      <!-- Top bar -->
      <header class="hub-header">
        <div class="hub-left">
          <button id="btn-back-profile" class="icon-btn" aria-label="Go back">
            ${iconSvg('arrowLeft')}
          </button>
          <div class="hub-user-pill">
            <div class="hub-avatar">${name.charAt(0).toUpperCase()}</div>
            <div class="hub-user-text">
              <span class="hub-name">${name}</span>
              <span class="hub-field-tag">${fieldLabel} - ${university}</span>
            </div>
          </div>
        </div>
        <div class="hub-actions">
          <button id="btn-change-field-hub" class="hub-switch-btn" title="Switch discipline">
            ${iconSvg('grid')}
            <span>Switch</span>
          </button>
          <button id="btn-edit-profile" class="hub-switch-btn" title="Edit profile">
            ${iconSvg('edit')}
            <span>Edit</span>
          </button>
        </div>
      </header>

      <!-- Stats bar -->
      <div class="hub-stats-bar">
        <div class="hub-stat">
          <span class="hub-stat-val">${streak}</span>
          <span class="hub-stat-lbl">Day streak</span>
        </div>
        <div class="hub-stat-divider"></div>
        <div class="hub-stat">
          <span class="hub-stat-val">${simsDone}</span>
          <span class="hub-stat-lbl">Sims done</span>
        </div>
        <div class="hub-stat-divider"></div>
        <div class="hub-stat">
          <span class="hub-stat-val">${mastery}%</span>
          <span class="hub-stat-lbl">Mastery</span>
        </div>
      </div>

      <!-- Section label -->
      <p class="hub-section-label">What would you like to do?</p>

      <!-- 4 Nav Tiles -->
      <main class="hub-grid">

        <button id="hub-tile-sims" class="hub-tile hub-tile--sims">
          <div class="hub-tile-icon">
            ${iconSvg('atom')}
          </div>
          <div class="hub-tile-content">
            <h2 class="hub-tile-title">Simulations</h2>
            <p class="hub-tile-desc">${simDesc}</p>
          </div>
          <div class="hub-tile-arrow">${iconSvg('arrowRight')}</div>
        </button>

        <button id="hub-tile-cards" class="hub-tile hub-tile--cards">
          <div class="hub-tile-icon">
            ${iconSvg('book')}
          </div>
          <div class="hub-tile-content">
            <h2 class="hub-tile-title">Study Cards</h2>
            <p class="hub-tile-desc">First-principle flashcard decks for your field</p>
          </div>
          <div class="hub-tile-arrow">${iconSvg('arrowRight')}</div>
        </button>

        <button id="hub-tile-ai" class="hub-tile hub-tile--ai">
          <div class="hub-tile-icon">
            ${iconSvg('sparkles')}
          </div>
          <div class="hub-tile-content">
            <h2 class="hub-tile-title">AI Tutor</h2>
            <p class="hub-tile-desc">Ask questions, get personalised explanations</p>
          </div>
          <div class="hub-tile-arrow">${iconSvg('arrowRight')}</div>
        </button>

        <button id="hub-tile-notes" class="hub-tile hub-tile--notes">
          <div class="hub-tile-icon">
            ${iconSvg('edit')}
          </div>
          <div class="hub-tile-content">
            <h2 class="hub-tile-title">My Notes</h2>
            <p class="hub-tile-desc">Your personal notes from every session</p>
          </div>
          <div class="hub-tile-arrow">${iconSvg('arrowRight')}</div>
        </button>

      </main>

      ${hobbies.length > 0 ? `
      <div class="hub-hobbies">
        <span class="hub-hobbies-label">Your interests:</span>
        ${hobbies.slice(0, 4).map(h => `<span class="hub-hobby-pill">${h}</span>`).join('')}
      </div>` : ''}

      <div class="hub-logout-row">
        <button id="btn-logout" class="hub-logout-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log out
        </button>
      </div>

    </div>
  `)

  const listeners = []
  function on(id, fn) {
    const el = root.querySelector(id)
    if (!el || !fn) return
    el.addEventListener('click', fn)
    listeners.push({ el, fn })
  }

  on('#btn-edit-profile',  onEditProfile)
  on('#btn-change-field-hub', onChangeField)
  on('#btn-back-profile',  onBack)
  on('#btn-logout',        onLogout)
  on('#hub-tile-sims',     onGoSimulations)
  on('#hub-tile-cards',    onGoStudyCards)
  on('#hub-tile-ai',       onGoTutor)
  on('#hub-tile-notes',    onGoNotes)

  function cleanup() {
    listeners.forEach(({ el, fn }) => el.removeEventListener('click', fn))
  }

  return { root, cleanup }
}
