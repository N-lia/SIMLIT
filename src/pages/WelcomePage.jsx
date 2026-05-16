import heroImg from '../assets/hero-african.png'
import './WelcomePage.css'
import { htmlToElement } from '../utils/dom.js'

export function mountWelcomePage({ onGetStarted }) {
  const root = htmlToElement(`
    <div class="page welcome-page">
      <header class="welcome-header">
        <div class="logo-group">
          <h1 class="logo-text">SIMLIT</h1>
          <span class="logo-sparkle sparkle-1">✦</span>
          <span class="logo-sparkle sparkle-2">✦</span>
        </div>
        <div class="header-decor">
          <span class="sparkle sparkle-purple">✦</span>
        </div>
      </header>
      <section class="hero-section">
        <h2 class="hero-heading">
          Learn<br />smarter.<br />
          <span class="hero-heading-accent">Grow further.</span>
        </h2>
        <p class="hero-subtext">
          Interactive learning<br />for ambitious minds.
        </p>
      </section>
      <section class="hero-visual">
        <div class="circle-bg"></div>
        <img src="${heroImg}" alt="Student reading a book" class="hero-image" draggable="false" />
        <div class="decor star-burst">
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0L33.5 26.5L60 30L33.5 33.5L30 60L26.5 33.5L0 30L26.5 26.5Z" fill="#8b5cf6" />
          </svg>
        </div>
        <div class="decor dot-yellow"></div>
        <div class="decor dot-green"></div>
        <div class="decor square-outline"></div>
        <div class="decor dot-small-orange"></div>
        <div class="decor dash-group"><span></span><span></span><span></span></div>
      </section>
      <footer class="welcome-footer">
        <button id="btn-get-started" class="btn-primary">
          <span>Let's get started</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12H19" />
            <path d="M12 5L19 12L12 19" />
          </svg>
        </button>
        <p class="login-text">
          Already have an account? <button type="button" class="login-link">Log in</button>
        </p>
      </footer>
    </div>
  `)

  const startButton = root.querySelector('#btn-get-started')
  startButton.addEventListener('click', onGetStarted)

  return { root }
}
