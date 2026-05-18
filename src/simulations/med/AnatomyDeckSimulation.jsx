import '../../pages/TarotCardsPage.css' // Reuse the same card CSS

export function mountAnatomyDeckSimulation(container) {
  const anatomyCards = [
    { title: 'The Heart (Four Chambers)', icon: 'heart', concept: 'Structural Anatomy', desc: 'Why four chambers? To permanently separate high-pressure oxygenated blood from low-pressure deoxygenated blood, allowing a dual-circuit pump.' },
    { title: 'The Alveoli', icon: 'alveoli', concept: 'Structural Anatomy', desc: 'Nature\'s fractal. Maximizing surface area within a confined volume to allow massive, instantaneous passive gas exchange.' },
    { title: 'The Circle of Willis', icon: 'brain', concept: 'Structural Anatomy', desc: 'The brain\'s failsafe. A circular arterial anastomosis that ensures if one major blood vessel is blocked, the brain still receives redundant blood flow.' },
    { title: 'The Capillary Bed', icon: 'capillary', concept: 'Structural Anatomy', desc: 'The microscopic exchange. Walls only one cell thick, allowing the slow, precise diffusion of oxygen, nutrients, and waste into local tissues.' },
    { title: 'The Synaptic Cleft', icon: 'synapse', concept: 'Structural Anatomy', desc: 'The 20-nanometer gap. By forcing an electrical signal to convert into a chemical one, the nervous system allows for modulation, memory, and complex decision-making.' },
    { title: 'The Myelin Sheath', icon: 'axon', concept: 'Structural Anatomy', desc: 'Biological insulation. A lipid layer that dramatically speeds up electrical conduction down an axon by forcing the signal to "jump" between nodes.' },
    { title: 'The Blood-Brain Barrier', icon: 'barrier', concept: 'Structural Anatomy', desc: 'The ultimate filter. Tightly knit endothelial cells that strictly regulate what molecules in the bloodstream are allowed to touch delicate brain tissue.' },
    { title: 'The Vagus Nerve', icon: 'nerve', concept: 'Structural Anatomy', desc: 'The great wanderer. The superhighway of the parasympathetic nervous system, reaching down from the brainstem to control the heart, lungs, and gut.' },
    { title: 'The Nephron', icon: 'kidney', concept: 'Structural Anatomy', desc: 'The microscopic kidney filter. It uses intense hydrostatic pressure to force everything out of the blood, then selectively reabsorbs only the water and ions the body needs.' },
    { title: 'Intestinal Villi', icon: 'villi', concept: 'Structural Anatomy', desc: 'The absorptive matrix. Millions of microscopic finger-like projections that vastly increase the surface area of the small intestine to capture passing nutrients.' },
    { title: 'Hepatic Portal Vein', icon: 'liver', concept: 'Structural Anatomy', desc: 'The nutrient tollbooth. Routing all blood from the digestive tract directly to the liver for immediate chemical processing and toxin neutralization before it hits the heart.' },
    { title: 'The Pancreas', icon: 'pancreas', concept: 'Structural Anatomy', desc: 'The dual factory. An exocrine gland releasing digestive enzymes into the gut, and an endocrine gland releasing insulin and glucagon into the blood.' },
    { title: 'The Osteon', icon: 'bone', concept: 'Structural Anatomy', desc: 'The pillars of bone. Concentric cylinders of calcified matrix built around central blood vessels, giving bone massive compressive strength while remaining relatively lightweight.' },
    { title: 'The Sarcomere', icon: 'muscle', concept: 'Structural Anatomy', desc: 'The engine of movement. The fundamental, microscopic contracting unit of muscle, where actin and myosin filaments physically grab and pull past one another.' },
    { title: 'The Diaphragm', icon: 'diaphragm', concept: 'Structural Anatomy', desc: 'The vacuum generator. A dome-shaped muscle that contracts downward, dropping intrathoracic pressure and forcing the atmosphere to rush into the lungs.' },
    { title: 'The Epidermis', icon: 'skin', concept: 'Structural Anatomy', desc: 'The stratified shield. Layers of tightly packed, keratinized dead cells that form a completely waterproof, pathogen-resistant barrier against the outside world.' },
    { title: 'The Cochlea', icon: 'ear', concept: 'Structural Anatomy', desc: 'The biological microphone. A fluid-filled spiral that mechanically sorts sound waves by frequency, physically bending microscopic hair cells to trigger nerves.' },
    { title: 'The Retina', icon: 'eye', concept: 'Structural Anatomy', desc: 'The photoreceptor canvas. A layer of highly specialized neurons (rods and cones) lining the back of the eye that translate raw photons into electrical logic.' },
    { title: 'The Spleen', icon: 'spleen', concept: 'Structural Anatomy', desc: 'The red blood cell graveyard. A highly vascular organ that filters the blood, destroying old or damaged erythrocytes and serving as a massive reservoir for immune cells.' },
    { title: 'Lymph Nodes', icon: 'lymph', concept: 'Structural Anatomy', desc: 'The biological checkpoints. Small, bean-shaped structures filled with white blood cells that actively filter lymphatic fluid for dangerous foreign antigens before returning it to the blood.' }
  ]

  const wrapper = document.createElement('div')
  wrapper.style.width = '100%'
  wrapper.style.height = '100%'
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.className = 'anatomy-deck-sim'

  // Similar layout to TarotCardsPage but contained within the simulation body
  wrapper.innerHTML = `
    <div class="tarot-deck-container" style="padding-top: 40px; background: transparent;">
      <div class="tarot-cards-wrapper" style="margin-bottom: 20px;">
        ${anatomyCards.map((card, index) => `
          <div class="tarot-card-wrap sim-anatomy-card" style="--card-idx: ${index}; z-index: ${anatomyCards.length - index};">
            <div class="tarot-card">
              <div class="tarot-card-inner">
                <div class="tarot-card-front">
                  <div class="tarot-border">
                    <div class="tarot-number">${toRoman(index + 1)}</div>
                    <div class="tarot-art-placeholder">
                      ${anatomyIcon(card.icon)}
                    </div>
                    <h3 class="tarot-title" style="font-size: 20px; text-transform: none;">${card.title}</h3>
                  </div>
                </div>
                <div class="tarot-card-back">
                  <div class="tarot-border back-border">
                    <h4 class="tarot-concept">${card.concept}</h4>
                    <p class="tarot-desc" style="font-size: 16px;">${card.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="tarot-controls">
        <button id="btn-prev-anat" class="btn-pill outline">&larr; Previous</button>
        <div class="tarot-counter"><span id="anat-current">1</span> / ${anatomyCards.length}</div>
        <button id="btn-next-anat" class="btn-pill outline">Next &rarr;</button>
      </div>
    </div>
  `

  container.appendChild(wrapper)

  let currentIndex = 0
  const cardWraps = wrapper.querySelectorAll('.sim-anatomy-card')
  const currentLabel = wrapper.querySelector('#anat-current')
  
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

  const btnNext = wrapper.querySelector('#btn-next-anat')
  const btnPrev = wrapper.querySelector('#btn-prev-anat')

  if (btnNext && btnPrev) {
    btnNext.addEventListener('click', handleNext)
    btnPrev.addEventListener('click', handlePrev)
    listeners.push({ element: btnNext, handler: handleNext, event: 'click' })
    listeners.push({ element: btnPrev, handler: handlePrev, event: 'click' })
  }

  // Swipe logic for mobile
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

  const deckContainer = wrapper.querySelector('.tarot-cards-wrapper')
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

  updateDeck()

  return function cleanup() {
    listeners.forEach(({ element, handler, event }) => element.removeEventListener(event, handler))
    wrapper.remove()
  }
}

function toRoman(num) {
  const roman = ["O","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"]
  return roman[num] || num
}

function anatomyIcon(name) {
  const paths = {
    heart: '<path d="M20.4 4.6a5.4 5.4 0 0 0-7.6 0l-.8.8-.8-.8a5.4 5.4 0 0 0-7.6 7.7L12 21l8.4-8.7a5.4 5.4 0 0 0 0-7.7Z"/><path d="M12 8v10"/><path d="M8.5 11.5h7"/>',
    alveoli: '<path d="M12 20V8"/><path d="M12 8c-3-3-6-3-8 0"/><path d="M12 8c3-3 6-3 8 0"/><circle cx="5" cy="10" r="2.5"/><circle cx="10" cy="7" r="2.2"/><circle cx="14" cy="7" r="2.2"/><circle cx="19" cy="10" r="2.5"/><path d="M8 15c-2 1-3 2-4 4"/><path d="M16 15c2 1 3 2 4 4"/>',
    brain: '<path d="M9 3a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 7 2.5V5A3 3 0 0 0 9 3Z"/><path d="M15 3a3 3 0 0 1 3 3v1a4 4 0 0 1 1 7.7V17a4 4 0 0 1-7 2.5V5a3 3 0 0 1 3-2Z"/><circle cx="12" cy="12" r="4"/><path d="M8 12h8"/><path d="M12 8v8"/>',
    capillary: '<path d="M3 8c4-4 7 4 11 0s5-2 7 0"/><path d="M3 16c4 4 7-4 11 0s5 2 7 0"/><circle cx="7" cy="12" r="1.2"/><circle cx="12" cy="11" r="1.2"/><circle cx="17" cy="13" r="1.2"/>',
    synapse: '<path d="M4 7c4 0 5 3 5 5s-1 5-5 5"/><path d="M20 7c-4 0-5 3-5 5s1 5 5 5"/><circle cx="10.5" cy="10" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="10.5" cy="14" r=".8"/><path d="M13 8v8"/>',
    axon: '<path d="M3 12h18"/><path d="M5 9c2-2 4-2 6 0"/><path d="M5 15c2 2 4 2 6 0"/><path d="M13 9c2-2 4-2 6 0"/><path d="M13 15c2 2 4 2 6 0"/><circle cx="3" cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/>',
    barrier: '<path d="M4 18V6"/><path d="M20 18V6"/><path d="M4 8h16"/><path d="M4 12h16"/><path d="M4 16h16"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="16" cy="10" r="1"/>',
    nerve: '<path d="M12 3v18"/><path d="M12 8c-4 0-6 2-7 5"/><path d="M12 10c4 0 6 2 7 5"/><path d="M12 14c-3 0-5 1-6 4"/><path d="M12 16c3 0 5 1 6 4"/><circle cx="12" cy="5" r="2"/>',
    kidney: '<path d="M9 4c-4 1-6 5-5 10 1 5 6 7 8 3 1-2-2-4-1-7 .5-2 2-5-2-6Z"/><path d="M15 4c4 1 6 5 5 10-1 5-6 7-8 3-1-2 2-4 1-7-.5-2-2-5 2-6Z"/><path d="M12 11v9"/><path d="M9 11h6"/>',
    villi: '<path d="M4 20V9c0-3 4-3 4 0v11"/><path d="M10 20V7c0-3 4-3 4 0v13"/><path d="M16 20V9c0-3 4-3 4 0v11"/><path d="M3 20h18"/>',
    liver: '<path d="M4 13c0-5 4-8 10-8 4 0 7 2 7 5 0 5-6 9-13 9-3 0-4-2-4-6Z"/><path d="M12 7v10"/><path d="M12 11h7"/><path d="M8 15h4"/>',
    pancreas: '<path d="M4 14c2-5 8-7 14-5 3 1 3 5 0 6-5 2-10 3-14-1Z"/><path d="M7 13c2 1 4 1 6 0"/><path d="M14 11c2 0 3 1 4 2"/>',
    bone: '<path d="M7 4a3 3 0 0 1 4 4l5 5a3 3 0 1 1-2 2l-5-5a3 3 0 1 1-2-6Z"/><circle cx="8" cy="7" r="1.2"/><circle cx="17" cy="16" r="1.2"/>',
    muscle: '<path d="M4 12c4-6 12-6 16 0-4 6-12 6-16 0Z"/><path d="M6 12h12"/><path d="M8 9l3 6"/><path d="M13 9l3 6"/>',
    diaphragm: '<path d="M4 15c4-8 12-8 16 0"/><path d="M4 15h16"/><path d="M7 15v4"/><path d="M12 15v4"/><path d="M17 15v4"/><path d="M8 8c-2 0-4 2-4 5"/><path d="M16 8c2 0 4 2 4 5"/>',
    skin: '<path d="M4 8h16"/><path d="M4 12h16"/><path d="M4 16h16"/><path d="M6 8c1-2 3-2 4 0"/><path d="M12 12c1-2 3-2 4 0"/><path d="M8 16c1-2 3-2 4 0"/>',
    ear: '<path d="M6 12a6 6 0 1 1 12 0c0 4-4 4-4 7"/><path d="M9 12a3 3 0 1 1 6 0c0 2-2 2-2 4"/><path d="M16 6c3 2 4 6 2 9"/><path d="M11 18h4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1"/><path d="M9 18l1-3"/><path d="M15 18l-1-3"/>',
    spleen: '<path d="M8 4c5-2 10 1 11 6 1 6-4 10-10 9-4-1-5-4-3-7 1-2 0-5 2-8Z"/><path d="M9 8c3 0 6 2 7 5"/><path d="M8 13c3 2 6 2 9 0"/>',
    lymph: '<circle cx="12" cy="12" r="4"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 8.5 9 10"/><path d="m17 8.5-2 1.5"/><path d="M7 15.5 9 14"/><path d="m17 15.5-2-1.5"/>',
  }

  return `
    <svg class="anatomy-organ-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${paths[name] || paths.heart}
    </svg>
  `
}
