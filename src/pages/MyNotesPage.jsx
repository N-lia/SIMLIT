import { htmlToElement } from '../utils/dom.js'
import './MyNotesPage.css'

export function mountMyNotesPage({ onBack, onOpenTutor, pageClass = '' }) {
  let notes = []
  try {
    notes = JSON.parse(localStorage.getItem('simlit_notes_list')) || []
  } catch {
    notes = []
  }
  
  if (notes.length === 0) {
    notes.push({ id: Date.now().toString(), title: 'Untitled Note', content: '', date: new Date().toLocaleDateString() })
  }
  let activeNoteId = notes[0].id

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

      <main class="notes-main-split">
        <aside class="notes-sidebar">
          <div class="sidebar-header">
            <h3>Notebooks</h3>
            <button id="btn-new-note" class="icon-btn" aria-label="New Note">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <div class="notes-list" id="notes-list"></div>
        </aside>

        <section class="notes-editor-section">
          <div class="notes-editor-wrapper">
            <input type="text" id="note-title-input" class="note-title-input" placeholder="Note Title" spellcheck="false" />
            <textarea 
              id="notes-textarea" 
              class="notes-textarea" 
              placeholder="Write down what you have learned here..."
              spellcheck="false"
            ></textarea>
          </div>
        </section>
      </main>
      
      <div class="tutor-modal hidden" id="tutor-modal">
        <div class="tutor-modal-content">
          <div class="tutor-modal-header">
            <h3>SIMLIT AI Tutor</h3>
            <button id="btn-close-tutor" class="icon-btn">&times;</button>
          </div>
          <div class="tutor-modal-body">
            <p><strong>AI:</strong> Hello! I am a multimodal model connected to your local Llama instance. You can send me text, pictures, or voice audio. What concept would you like to explore today?</p>
            <div class="tutor-chat-placeholder">
               <span class="offline-badge">Multimodal Ready</span>
            </div>
          </div>
          <div class="tutor-modal-footer">
            <button class="icon-btn attachment-btn" aria-label="Attach Media">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button class="icon-btn attachment-btn" aria-label="Record Audio">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <input type="text" placeholder="Ask a question..." class="tutor-input" />
            <button class="btn-pill dark">Send</button>
          </div>
        </div>
      </div>
    </div>
  `)

  const notesListEl = root.querySelector('#notes-list')
  const titleInput = root.querySelector('#note-title-input')
  const textarea = root.querySelector('#notes-textarea')
  const newNoteBtn = root.querySelector('#btn-new-note')
  
  const saveToLocal = () => {
    localStorage.setItem('simlit_notes_list', JSON.stringify(notes))
  }

  const renderList = () => {
    notesListEl.textContent = ''
    notes.forEach((note) => {
      const item = document.createElement('button')
      item.className = `note-list-item ${note.id === activeNoteId ? 'active' : ''}`
      item.type = 'button'
      item.dataset.id = note.id

      const title = document.createElement('span')
      title.className = 'note-list-title'
      title.textContent = note.title || 'Untitled Note'

      const date = document.createElement('span')
      date.className = 'note-list-date'
      date.textContent = note.date

      item.append(title, date)
      notesListEl.appendChild(item)
    })
  }

  const loadActiveNote = () => {
    const note = notes.find(n => n.id === activeNoteId)
    if (note) {
      titleInput.value = note.title
      textarea.value = note.content
    } else {
      titleInput.value = ''
      textarea.value = ''
    }
    renderList()
  }

  const handleInput = () => {
    const note = notes.find(n => n.id === activeNoteId)
    if (note) {
      note.title = titleInput.value
      note.content = textarea.value
      saveToLocal()
      renderList()
    }
  }

  const handleNewNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      date: new Date().toLocaleDateString()
    }
    notes.unshift(newNote)
    activeNoteId = newNote.id
    saveToLocal()
    loadActiveNote()
  }

  const handleListClick = (e) => {
    const item = e.target.closest('.note-list-item')
    if (item) {
      activeNoteId = item.dataset.id
      loadActiveNote()
    }
  }

  titleInput.addEventListener('input', handleInput)
  textarea.addEventListener('input', handleInput)
  newNoteBtn.addEventListener('click', handleNewNote)
  notesListEl.addEventListener('click', handleListClick)

  loadActiveNote()

  // Modal logic
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
    { element: titleInput, event: 'input', handler: handleInput },
    { element: textarea, event: 'input', handler: handleInput },
    { element: newNoteBtn, event: 'click', handler: handleNewNote },
    { element: notesListEl, event: 'click', handler: handleListClick },
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
