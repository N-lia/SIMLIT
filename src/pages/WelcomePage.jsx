import heroImg from '../assets/hero-african.png'
import engImg from '../assets/engineering-vintage.png'
import lawImg from '../assets/law-vintage.png'
import './WelcomePage.css'
import { htmlToElement } from '../utils/dom.js'

export function mountWelcomePage({ onGetStarted }) {
  const root = htmlToElement(`
    <div class="page welcome-page">
      <main class="hero-main">
        <div class="hero-tag">
          <span class="tag-highlight">Over 50</span> active simulations
        </div>
        
        <h1 class="hero-title">
          Master complex concepts through <br class="desktop-only"/>
          <strong>hands-on interaction</strong>
        </h1>
        
        <p class="hero-desc">
          Engaging, high-fidelity simulations that bridge the gap between theory and practice<br class="desktop-only"/>
          in Engineering, Medicine, Computer Science and Law.
        </p>

        <div class="hero-cta-group">
          <button id="btn-get-started" class="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Let's Start</span>
          </button>
          <button class="btn-secondary">Log in</button>
        </div>

        <div class="hero-gallery">
          <div class="gallery-card left">
            <div class="gallery-card-inner">
              <span class="card-hint">Engineering Mechanics</span>
              <img src="${engImg}" alt="Engineering" />
            </div>
          </div>
          
          <div class="gallery-card center">
            <img src="${heroImg}" alt="Hero Student" />
          </div>
          
          <div class="gallery-card right">
            <div class="gallery-card-inner">
              <span class="card-hint">Moot Court Simulator</span>
              <img src="${lawImg}" alt="Law" />
            </div>
          </div>
        </div>
      </main>
    </div>
  `)

  const startButton = root.querySelector('#btn-get-started')
  startButton.addEventListener('click', onGetStarted)

  return { root }
}
