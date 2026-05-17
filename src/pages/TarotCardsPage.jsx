import { FIELD_TOPICS } from '../data/topics.js'
import './TarotCardsPage.css'

export function mountTarotCardsPage({ subfieldId, onBack, pageClass = '' }) {
  const fieldData = FIELD_TOPICS[subfieldId] || { label: 'Topics', cards: [] }
  const cards = fieldData.cards || []

  const root = document.createElement('div')
  root.className = `page tarot-page ${pageClass}`
  root.innerHTML = `
    <header class="tarot-header">
      <button id="btn-back-tarot" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/><path d="M12 19L5 12L12 5"/>
        </svg>
      </button>
      <div class="tarot-header-title">Arcana of ${fieldData.label}</div>
      <div class="header-spacer"></div>
    </header>
    
    <main class="tarot-deck-container">
      ${cards.length === 0 ? '<p class="empty-cards">The cards have not revealed their secrets yet.</p>' : ''}
      <div class="tarot-cards-wrapper">
        ${cards.map((card, index) => `
          <div class="tarot-card-wrap" style="--card-idx: ${index}; z-index: ${cards.length - index};">
            <div class="tarot-card">
              <div class="tarot-card-inner">
                <div class="tarot-card-front">
                  <div class="tarot-border">
                    <div class="tarot-number">${toRoman(index + 1)}</div>
                    <div class="tarot-art-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
                      </svg>
                    </div>
                    <h3 class="tarot-title">${card.title}</h3>
                  </div>
                </div>
                <div class="tarot-card-back">
                  <div class="tarot-border back-border">
                    <h4 class="tarot-concept">${card.concept}</h4>
                    <p class="tarot-desc">${card.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${cards.length > 0 ? `
        <div class="tarot-controls">
          <button id="btn-prev-card" class="btn-pill outline">&larr; Draw Previous</button>
          <div class="tarot-counter"><span id="card-current">1</span> / ${cards.length}</div>
          <button id="btn-next-card" class="btn-pill outline">Draw Next &rarr;</button>
        </div>
      ` : ''}
    </main>
  `

  let currentIndex = 0
  const cardWraps = root.querySelectorAll('.tarot-card-wrap')
  const currentLabel = root.querySelector('#card-current')
  
  function updateDeck() {
    if (!cardWraps.length) return
    cardWraps.forEach((wrap, i) => {
      wrap.classList.remove('active', 'past', 'future')
      if (i === currentIndex) {
        wrap.classList.add('active')
      } else if (i < currentIndex) {
        wrap.classList.add('past')
      } else {
        wrap.classList.add('future')
      }
    })
    if (currentLabel) {
      currentLabel.textContent = currentIndex + 1
    }
  }

  const listeners = []

  // Next / Prev logic
  const handleNext = () => {
    if (currentIndex < cardWraps.length - 1) {
      currentIndex++
      updateDeck()
    }
  }
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      currentIndex--
      updateDeck()
    }
  }

  const btnNext = root.querySelector('#btn-next-card')
  const btnPrev = root.querySelector('#btn-prev-card')

  if (btnNext && btnPrev) {
    btnNext.addEventListener('click', handleNext)
    btnPrev.addEventListener('click', handlePrev)
    listeners.push({ element: btnNext, handler: handleNext, event: 'click' })
    listeners.push({ element: btnPrev, handler: handlePrev, event: 'click' })
  }

  // Swipe logic
  let touchStartX = 0
  let touchEndX = 0

  const handleTouchStart = e => {
    touchStartX = e.changedTouches[0].screenX
  }

  const handleTouchEnd = e => {
    touchEndX = e.changedTouches[0].screenX
    const threshold = 50
    if (touchEndX < touchStartX - threshold) handleNext()
    if (touchEndX > touchStartX + threshold) handlePrev()
  }

  const deckContainer = root.querySelector('.tarot-cards-wrapper')
  if (deckContainer) {
    deckContainer.addEventListener('touchstart', handleTouchStart, { passive: true })
    deckContainer.addEventListener('touchend', handleTouchEnd, { passive: true })
    listeners.push({ element: deckContainer, handler: handleTouchStart, event: 'touchstart' })
    listeners.push({ element: deckContainer, handler: handleTouchEnd, event: 'touchend' })
  }

  // Flip logic
  cardWraps.forEach(wrap => {
    const card = wrap.querySelector('.tarot-card')
    const handleFlip = () => {
      if (wrap.classList.contains('active')) {
        card.classList.toggle('flipped')
      }
    }
    card.addEventListener('click', handleFlip)
    listeners.push({ element: card, handler: handleFlip, event: 'click' })
  })

  const backButton = root.querySelector('#btn-back-tarot')
  backButton.addEventListener('click', onBack)
  listeners.push({ element: backButton, handler: onBack, event: 'click' })

  updateDeck()

  function cleanup() {
    listeners.forEach(({ element, handler, event = 'click' }) => element.removeEventListener(event, handler))
  }

  return { root, cleanup }
}

function toRoman(num) {
  const roman = ["O","I","II","III","IV","V","VI","VII","VIII","IX","X"]
  return roman[num] || num
}
