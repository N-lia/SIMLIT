import { askSimlitTutor, getLlamaRuntimeStatus, readAttachment } from '../ai/llamaClient.js'
import { escapeHtml, htmlToElement } from '../utils/dom.js'
import { renderMarkdownText } from '../utils/markdownText.js'
import './MyNotesPage.css'

export function mountMyNotesPage({ onBack, onOpenTutor, openTutorOnMount = false, pageClass = '' }) {
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
            <div class="tutor-chat-log" id="tutor-chat-log" aria-live="polite">
              <div class="tutor-message ai">
                <strong>SIMLIT:</strong>
                <p>Every great insight starts with a question. What's yours?</p>
              </div>
            </div>
            <span class="offline-badge" id="tutor-media-badge" style="display: none;">Text model ready</span>
          </div>
          <div class="tutor-modal-footer">
            <input id="tutor-image-input" type="file" accept="image/*" hidden />
            <input id="tutor-audio-input" type="file" accept="audio/*" hidden />
            <button id="btn-attach-image" class="icon-btn attachment-btn" type="button" aria-label="Attach image">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button id="btn-attach-audio" class="icon-btn attachment-btn" type="button" aria-label="Attach audio">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <input id="tutor-input" type="text" placeholder="Ask a question..." class="tutor-input" />
            <button id="btn-send-tutor" class="btn-pill dark" type="button">Send</button>
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
  const tutorChatLog = root.querySelector('#tutor-chat-log')
  const tutorInput = root.querySelector('#tutor-input')
  const tutorSendBtn = root.querySelector('#btn-send-tutor')
  const imageInput = root.querySelector('#tutor-image-input')
  const audioInput = root.querySelector('#tutor-audio-input')
  const attachImageBtn = root.querySelector('#btn-attach-image')
  const attachAudioBtn = root.querySelector('#btn-attach-audio')
  const mediaBadge = root.querySelector('#tutor-media-badge')
  let pendingAttachments = []
  let tutorTranscript = []
  let tutorAbort = null
  let runtimeCheckId = 0

  const setRuntimeBadge = (text, tone = '') => {
    if (!mediaBadge || pendingAttachments.length) return
    mediaBadge.style.display = 'inline-block'
    mediaBadge.classList.remove('has-media', 'offline', 'checking')
    if (tone) mediaBadge.classList.add(tone)
    mediaBadge.textContent = text
  }

  const checkTutorRuntime = async () => {
    const checkId = ++runtimeCheckId
    setRuntimeBadge('Checking AI...', 'checking')
    const status = await getLlamaRuntimeStatus()
    if (checkId !== runtimeCheckId || pendingAttachments.length) return
    if (status.available && status.modelLoaded) {
      setRuntimeBadge('AI ready')
      return
    }
    setRuntimeBadge('AI offline. Check demo key or start local AI.', 'offline')
  }

  const handleOpenTutor = () => {
    tutorModal.classList.remove('hidden')
    tutorInput?.focus()
    checkTutorRuntime()
    if (onOpenTutor) onOpenTutor()
  }

  const handleCloseTutor = () => {
    tutorModal.classList.add('hidden')
  }

  const renderTutorMessage = (role, text) => {
    const message = document.createElement('div')
    message.className = `tutor-message ${role}`
    message.innerHTML = `<strong>${role === 'student' ? 'You' : 'SIMLIT'}:</strong>`
    const body = document.createElement('div')
    body.className = 'tutor-message-body'
    if (role === 'ai') {
      renderMarkdownText(body, text)
    } else {
      body.innerHTML = `<p>${escapeHtml(text)}</p>`
    }
    message.append(body)
    tutorChatLog.appendChild(message)
    tutorChatLog.scrollTop = tutorChatLog.scrollHeight
    return message
  }

  const refreshMediaBadge = () => {
    if (!pendingAttachments.length) {
      mediaBadge.style.display = 'none'
      mediaBadge.classList.remove('has-media', 'offline', 'checking')
      return
    }
    mediaBadge.style.display = 'inline-block'
    mediaBadge.classList.remove('offline', 'checking')
    const labels = pendingAttachments.map((item) => item.type.startsWith('audio/') ? 'audio' : 'image')
    mediaBadge.textContent = `Multimodal request: ${labels.join(', ')}`
    mediaBadge.classList.add('has-media')
  }

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      pendingAttachments = [await readAttachment(file)]
      refreshMediaBadge()
    } catch {
      renderTutorMessage('ai', 'I could not read that media file. Try another image or audio clip.')
    }
  }

  const handleTutorKeydown = (event) => {
    if (event.key === 'Enter') handleSendTutor()
  }

  const handleAttachImage = () => imageInput.click()
  const handleAttachAudio = () => audioInput.click()

  const handleSendTutor = async () => {
    const question = tutorInput.value.trim()
    if (!question && pendingAttachments.length === 0) return
    const activeNote = notes.find(n => n.id === activeNoteId)
    const attachments = pendingAttachments
    const userPrompt = question || 'Please explain the attached media.'
    const recentTranscript = tutorTranscript.slice(-8)
    pendingAttachments = []
    refreshMediaBadge()
    tutorInput.value = ''
    renderTutorMessage('student', userPrompt)
    const pending = renderTutorMessage('ai', 'Thinking...')
    tutorSendBtn.disabled = true
    tutorAbort?.abort()
    tutorAbort = new AbortController()
    const timeout = window.setTimeout(() => tutorAbort.abort(), 45000)
    const response = await askSimlitTutor({
      question: question || 'Explain this attached media in the context of my study notes.',
      noteTitle: activeNote?.title || '',
      noteContent: activeNote?.content || '',
      attachments,
      transcript: recentTranscript,
      signal: tutorAbort.signal,
    })
    window.clearTimeout(timeout)
    renderMarkdownText(pending.querySelector('.tutor-message-body'), response.text)
    tutorTranscript = [
      ...tutorTranscript,
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: response.text },
    ].slice(-10)
    tutorSendBtn.disabled = false
  }

  tutorBtn.addEventListener('click', handleOpenTutor)
  closeTutorBtn.addEventListener('click', handleCloseTutor)
  tutorSendBtn.addEventListener('click', handleSendTutor)
  tutorInput.addEventListener('keydown', handleTutorKeydown)
  attachImageBtn.addEventListener('click', handleAttachImage)
  attachAudioBtn.addEventListener('click', handleAttachAudio)
  imageInput.addEventListener('change', handleFileSelected)
  audioInput.addEventListener('change', handleFileSelected)

  if (openTutorOnMount) {
    window.setTimeout(handleOpenTutor, 0)
  }

  const listeners = [
    { element: titleInput, event: 'input', handler: handleInput },
    { element: textarea, event: 'input', handler: handleInput },
    { element: newNoteBtn, event: 'click', handler: handleNewNote },
    { element: notesListEl, event: 'click', handler: handleListClick },
    { element: backBtn, event: 'click', handler: onBack },
    { element: tutorBtn, event: 'click', handler: handleOpenTutor },
    { element: closeTutorBtn, event: 'click', handler: handleCloseTutor },
    { element: tutorSendBtn, event: 'click', handler: handleSendTutor },
    { element: tutorInput, event: 'keydown', handler: handleTutorKeydown },
    { element: attachImageBtn, event: 'click', handler: handleAttachImage },
    { element: attachAudioBtn, event: 'click', handler: handleAttachAudio },
    { element: imageInput, event: 'change', handler: handleFileSelected },
    { element: audioInput, event: 'change', handler: handleFileSelected },
  ]

  function cleanup() {
    tutorAbort?.abort()
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
  }

  return { root, cleanup }
}
