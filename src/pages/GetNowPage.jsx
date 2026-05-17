import { htmlToElement } from '../utils/dom.js'
import { iconSvg } from '../utils/icons.js'
import './GetNowPage.css'

export function mountGetNowPage({ onBack, onTryDemo, pageClass = '' }) {
  const root = htmlToElement(`
    <main class="page getnow-page ${pageClass}">
      <header class="getnow-header">
        <button id="btn-back-getnow" class="icon-btn" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/><path d="M12 19L5 12L12 5"/>
          </svg>
        </button>
        <div class="getnow-brand">${iconSvg('bookOpen', 'app-icon')} SIMLIT</div>
        <button id="btn-demo-getnow" type="button" class="getnow-demo-btn">Try demo</button>
      </header>

      <section class="getnow-intro">
        <p class="getnow-kicker">Download bundles</p>
        <h1>Choose the SIMLIT bundle for your device.</h1>
        <p>
          Android and desktop are the first planned bundles because they are easier to distribute and test broadly. iOS is not listed yet until the app packaging path is confirmed.
        </p>
      </section>

      <section class="bundle-grid">
        <article class="bundle-card bundle-card-android">
          <div class="bundle-icon">${iconSvg('cpu', 'app-icon')}</div>
          <div>
            <p class="bundle-label">Android bundle</p>
            <h2>SIMLIT for Android</h2>
            <p class="bundle-copy">For phones and tablets. Built for students who want portable labs, quick practice, and offline-ready study sessions.</p>
          </div>
          <ul>
            <li>Touch-first simulation controls</li>
            <li>Compact lessons and visual labs</li>
            <li>Designed for classroom and personal study</li>
          </ul>
          <a class="bundle-button" href="/downloads/simlit-android.apk" aria-label="Get SIMLIT Android bundle">
            <span>Get Android bundle</span>
            ${iconSvg('briefcase', 'app-icon')}
          </a>
        </article>

        <article class="bundle-card bundle-card-desktop">
          <div class="bundle-icon">${iconSvg('monitor', 'app-icon')}</div>
          <div>
            <p class="bundle-label">Desktop bundle</p>
            <h2>SIMLIT for Desktop</h2>
            <p class="bundle-copy">For laptops and computer labs. Best for larger simulations, teaching sessions, and deeper visual exploration.</p>
          </div>
          <ul>
            <li>Wide-screen simulator layouts</li>
            <li>Keyboard and mouse friendly controls</li>
            <li>Useful for schools, labs, and demos</li>
          </ul>
          <a class="bundle-button" href="/downloads/simlit-desktop.zip" aria-label="Get SIMLIT desktop bundle">
            <span>Get Desktop bundle</span>
            ${iconSvg('briefcase', 'app-icon')}
          </a>
        </article>
      </section>

      <section class="getnow-note">
        ${iconSvg('tool', 'app-icon')}
        <p>Bundle filenames are wired as stable download targets. Add the packaged files to <code>public/downloads/</code> when the builds are ready.</p>
      </section>
    </main>
  `)

  const backButton = root.querySelector('#btn-back-getnow')
  const demoButton = root.querySelector('#btn-demo-getnow')
  backButton.addEventListener('click', onBack)
  demoButton.addEventListener('click', onTryDemo)

  return {
    root,
    cleanup() {
      backButton.removeEventListener('click', onBack)
      demoButton.removeEventListener('click', onTryDemo)
    },
  }
}
