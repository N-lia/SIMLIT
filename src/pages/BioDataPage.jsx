import './BioDataPage.css'

const initialFormData = { name: '', age: '', university: '' }

export function mountBioDataPage({ onBack, onComplete, pageClass = '' }) {
  const root = document.createElement('div')
  root.className = `page biodata-page ${pageClass}`
  root.innerHTML = `
    <header class="bio-header">
      <button id="btn-back-biodata" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/>
          <path d="M12 19L5 12L12 5"/>
        </svg>
      </button>
      <div class="progress-dots">
        <div class="dot"></div>
        <div class="dot active"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="header-spacer"></div>
    </header>
    <section class="bio-content">
      <h2 class="bio-title">Tell us about<br/>yourself</h2>
      <p class="bio-subtitle">Provide your details to personalize<br/>your learning experience.</p>
      <form id="biodata-form" class="bio-form">
        <div class="form-group" data-field="name">
          <label for="input-name">Full Name</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input type="text" id="input-name" name="name" placeholder="John Doe" />
          </div>
        </div>
        <div class="form-group" data-field="age">
          <label for="input-age">Age</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <input type="number" id="input-age" name="age" placeholder="21" min="10" max="100" />
          </div>
        </div>
        <div class="form-group" data-field="university">
          <label for="input-university">University Name</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <input type="text" id="input-university" name="university" placeholder="Stanford University" />
          </div>
        </div>
      </form>
    </section>
    <footer class="bio-footer">
      <button id="btn-continue" type="button" class="btn-continue disabled" disabled>
        <span>Continue</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12H19"/>
          <path d="M12 5L19 12L12 19"/>
        </svg>
      </button>
    </footer>
  `

  let formData = { ...initialFormData }
  let submitted = false
  let timeoutId = null
  const listeners = []

  const nameInput = root.querySelector('#input-name')
  const ageInput = root.querySelector('#input-age')
  const universityInput = root.querySelector('#input-university')
  const continueButton = root.querySelector('#btn-continue')
  const backButton = root.querySelector('#btn-back-biodata')

  function updateFieldState(field) {
    const group = root.querySelector(`.form-group[data-field="${field}"]`)
    const value = formData[field]
    if (!group) return
    group.classList.toggle('focused', document.activeElement === root.querySelector(`#input-${field}`))
    group.classList.toggle('filled', !!value)
  }

  function updateControls() {
    const valid = formData.name.trim() && formData.age.trim() && formData.university.trim()
    continueButton.disabled = !valid
    continueButton.classList.toggle('disabled', !valid)
  }

  function renderSuccessState() {
    root.innerHTML = `
      <div class="success-state">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 class="success-title">You're all set!</h2>
        <p class="success-message">Welcome, <strong>${formData.name}</strong>.<br />Your personalized learning experience is being prepared.</p>
        <div class="success-badge">🎓 Profile created</div>
      </div>
    `
  }

  function handleChange(event) {
    const { name, value } = event.target
    formData = { ...formData, [name]: value }
    updateFieldState(name)
    updateControls()
  }

  function handleFocus(event) {
    updateFieldState(event.target.name)
  }

  function handleBlur(event) {
    updateFieldState(event.target.name)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (submitted) return
    submitted = true
    renderSuccessState()
    timeoutId = window.setTimeout(() => {
      onComplete?.()
    }, 1400)
  }

  nameInput.addEventListener('input', handleChange)
  ageInput.addEventListener('input', handleChange)
  universityInput.addEventListener('input', handleChange)
  nameInput.addEventListener('focus', handleFocus)
  ageInput.addEventListener('focus', handleFocus)
  universityInput.addEventListener('focus', handleFocus)
  nameInput.addEventListener('blur', handleBlur)
  ageInput.addEventListener('blur', handleBlur)
  universityInput.addEventListener('blur', handleBlur)
  continueButton.addEventListener('click', handleSubmit)
  backButton.addEventListener('click', onBack)
  listeners.push({ element: nameInput, handler: handleChange })
  listeners.push({ element: ageInput, handler: handleChange })
  listeners.push({ element: universityInput, handler: handleChange })
  listeners.push({ element: nameInput, handler: handleFocus })
  listeners.push({ element: ageInput, handler: handleFocus })
  listeners.push({ element: universityInput, handler: handleFocus })
  listeners.push({ element: nameInput, handler: handleBlur })
  listeners.push({ element: ageInput, handler: handleBlur })
  listeners.push({ element: universityInput, handler: handleBlur })
  listeners.push({ element: continueButton, handler: handleSubmit })
  listeners.push({ element: backButton, handler: onBack })

  updateControls()

  function cleanup() {
    listeners.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler)
      element.removeEventListener('input', handler)
      element.removeEventListener('focus', handler)
      element.removeEventListener('blur', handler)
    })
    if (timeoutId) window.clearTimeout(timeoutId)
  }

  return { root, cleanup }
}
