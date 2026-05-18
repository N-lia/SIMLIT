import './HobbiesPage.css'

const HOBBIES = [
  { id: 'gaming', label: 'Video Games', icon: 'zap' },
  { id: 'sports', label: 'Sports & Fitness', icon: 'activity' },
  { id: 'music', label: 'Music', icon: 'music' }, // Need a generic icon or use generic
  { id: 'art', label: 'Art & Design', icon: 'penTool' },
  { id: 'reading', label: 'Reading', icon: 'book' },
  { id: 'tech', label: 'Tech & Coding', icon: 'cpu' },
  { id: 'movies', label: 'Movies & Anime', icon: 'monitor' },
  { id: 'cooking', label: 'Cooking', icon: 'coffee' }
]

export function mountHobbiesPage({ onBack, onComplete, isEditing = false, pageClass = '' }) {
  // Pre-load saved hobbies when in edit mode
  let savedHobbies = []
  if (isEditing) {
    try {
      const saved = JSON.parse(localStorage.getItem('simlit_profile')) || {}
      savedHobbies = saved.hobbies || []
    } catch { savedHobbies = [] }
  }

  const root = document.createElement('div')
  root.className = `page hobbies-page ${pageClass}`
  
  root.innerHTML = `
    <header class="bio-header">
      <button id="btn-back-hobbies" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/>
          <path d="M12 19L5 12L12 5"/>
        </svg>
      </button>
      ${isEditing ? `<div class="hub-header-title">Edit Preferences</div>` : `<div class="progress-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot active"></div>
        <div class="dot"></div>
      </div>`}
      <div class="header-spacer"></div>
    </header>
    <section class="bio-content">
      <h2 class="bio-title">${isEditing ? 'Update your\ninterests' : 'What are your\nhobbies?'}</h2>
      <p class="bio-subtitle">${isEditing
        ? 'Your AI Tutor uses these to craft analogies that click.'
        : 'This helps our AI Tutor explain complex<br/>engineering and medical concepts using analogies you love.'
      }</p>
      
      <div class="hobbies-grid">
        ${HOBBIES.map(hobby => `
          <button class="hobby-pill" data-id="${hobby.id}">
            <span class="hobby-label">${hobby.label}</span>
          </button>
        `).join('')}
      </div>

      <div class="form-group" style="margin-top: 24px;">
        <label for="input-other-hobby">Other Interests (Optional)</label>
        <div class="input-wrapper">
          <input type="text" id="input-other-hobby" placeholder="e.g. Photography, Cars, Space..." />
        </div>
      </div>

    </section>
    <footer class="bio-footer">
      <button id="btn-continue-hobbies" type="button" class="btn-continue disabled" disabled>
        <span>${isEditing ? 'Save Changes' : 'Complete Profile'}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12H19"/>
          <path d="M12 5L19 12L12 19"/>
        </svg>
      </button>
    </footer>
  `

  let selectedHobbies = new Set()
  let otherHobby = ''
  let submitted = false
  let timeoutId = null
  const listeners = []

  const hobbyPills = root.querySelectorAll('.hobby-pill')
  const otherInput = root.querySelector('#input-other-hobby')
  const continueButton = root.querySelector('#btn-continue-hobbies')
  const backButton = root.querySelector('#btn-back-hobbies')

  // Pre-select saved hobbies in edit mode
  if (isEditing && savedHobbies.length > 0) {
    const knownLabels = new Map(HOBBIES.map(h => [h.label.toLowerCase(), h.id]))
    savedHobbies.forEach(label => {
      const id = knownLabels.get(label.toLowerCase())
      if (id) {
        selectedHobbies.add(id)
        const pill = root.querySelector(`.hobby-pill[data-id="${id}"]`)
        if (pill) pill.classList.add('selected')
      } else {
        // custom hobby — put it in the text field
        if (!otherHobby) {
          otherHobby = label
          if (otherInput) otherInput.value = label
        }
      }
    })
    // Enable continue if pre-selection is valid
    updateControls()
  }

  function updateControls() {
    const valid = selectedHobbies.size > 0 || otherHobby.trim().length > 0
    continueButton.disabled = !valid
    continueButton.classList.toggle('disabled', !valid)
  }

  function handlePillClick(e) {
    const pill = e.currentTarget
    const id = pill.dataset.id
    if (selectedHobbies.has(id)) {
      selectedHobbies.delete(id)
      pill.classList.remove('selected')
    } else {
      selectedHobbies.add(id)
      pill.classList.add('selected')
    }
    updateControls()
  }

  function handleOtherInput(e) {
    otherHobby = e.target.value
    updateControls()
  }

  function renderSuccessState() {
    root.innerHTML = `
      <div class="success-state">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 class="success-title">Profile Ready!</h2>
        <p class="success-message">Your AI Tutor is calibrating analogies<br/>based on your interests.</p>
      </div>
    `
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (submitted) return
    submitted = true
    
    const finalHobbies = Array.from(selectedHobbies).map(id => HOBBIES.find(h => h.id === id).label)
    if (otherHobby.trim()) {
      finalHobbies.push(otherHobby.trim())
    }

    if (isEditing) {
      // In edit mode: save and return immediately, no success screen
      onComplete?.(finalHobbies)
    } else {
      // First-time onboarding: show success flash then continue
      renderSuccessState()
      timeoutId = window.setTimeout(() => {
        onComplete?.(finalHobbies)
      }, 1400)
    }
  }

  hobbyPills.forEach(pill => {
    pill.addEventListener('click', handlePillClick)
    listeners.push({ element: pill, handler: handlePillClick, event: 'click' })
  })

  otherInput.addEventListener('input', handleOtherInput)
  continueButton.addEventListener('click', handleSubmit)
  backButton.addEventListener('click', onBack)
  
  listeners.push({ element: otherInput, handler: handleOtherInput, event: 'input' })
  listeners.push({ element: continueButton, handler: handleSubmit, event: 'click' })
  listeners.push({ element: backButton, handler: onBack, event: 'click' })

  function cleanup() {
    window.clearTimeout(timeoutId)
    listeners.forEach(({ element, handler, event }) => {
      element.removeEventListener(event, handler)
    })
  }

  return { root, cleanup }
}
