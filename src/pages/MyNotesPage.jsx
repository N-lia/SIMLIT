import { htmlToElement } from '../utils/dom.js'
import './MyNotesPage.css'

export function mountMyNotesPage({ onBack, onOpenTutor, pageClass = '' }) {
  const root = htmlToElement(`
    <div class="page notes-page ${pageClass}">
      <header class="notes-header">
        <button id="btn-back-notes" class="icon-btn" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/><path d="M12 19L5 12L12 5"/>
          </svg>
        </button>
        <div class="notes-header-title">My Notes</div>
        <button id="btn-tutor-ai" class="btn-pill dark tutor-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 7.49-3.05 10-7 10H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2c3.95 0 7-2.51 7-10z" />
            <path d="M19 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2c-3.95 0-7 2.51-7 10a2 2 0 0 1-2-2c0-7.49 3.05-10 7-10z" />
          </svg>
          Tutor (AI)
        </button>
      </header>

      <main class="notes-main">
        <div class="notes-editor-wrapper">
          <textarea 
            id="notes-textarea" 
            class="notes-textarea" 
            placeholder="Write down what you have learned here..."
            spellcheck="false"
          ></textarea>
        </div>
      </main>
      
      <div class="tutor-modal hidden" id="tutor-modal">
        <div class="tutor-modal-content">
          <div class="tutor-modal-header">
            <h3>SIMLIT AI Tutor</h3>
            <button id="btn-close-tutor" class="icon-btn">&times;</button>
          </div>
          <div class="tutor-modal-body">
            <p><strong>AI:</strong> Hello! I am connected to your local Llama model. What concept would you like to explore today?</p>
            <div class="tutor-chat-placeholder">
               <span class="offline-badge">Offline Model Ready</span>
            </div>
          </div>
          <div class="tutor-modal-footer">
            <input type="text" placeholder="Ask a question..." class="tutor-input" />
            <button class="btn-pill dark">Send</button>
          </div>
        </div>
      </div>
    </div>
  `)

  const textarea = root.querySelector('#notes-textarea')
  const savedNotes = localStorage.getItem('simlit_user_notes') || ''
  textarea.value = savedNotes

  const handleInput = () => {
    localStorage.setItem('simlit_user_notes', textarea.value)
  }
  textarea.addEventListener('input', handleInput)

  const backBtn = root.querySelector('#btn-back-notes')
  backBtn.addEventListener('click', onBack)

  const tutorBtn = root.querySelector('#btn-tutor-ai')
  const tutorModal = root.querySelector('#tutor-modal')
  const closeTutorBtn = root.querySelector('#btn-close-tutor')

  const handleOpenTutor = () => {
    tutorModal.classList.remove('hidden')
    if (onOpenTutor) onOpenTutor()
  }

  const handleCloseTutor = () => {
    tutorModal.classList.add('hidden')
  }

  tutorBtn.addEventListener('click', handleOpenTutor)
  closeTutorBtn.addEventListener('click', handleCloseTutor)

  const listeners = [
    { element: textarea, event: 'input', handler: handleInput },
    { element: backBtn, event: 'click', handler: onBack },
    { element: tutorBtn, event: 'click', handler: handleOpenTutor },
    { element: closeTutorBtn, event: 'click', handler: handleCloseTutor },
  ]

  function cleanup() {
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
  }

  return { root, cleanup }
}
