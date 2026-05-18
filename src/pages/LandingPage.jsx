import { htmlToElement } from '../utils/dom.js'
import { iconSvg } from '../utils/icons.js'
import './LandingPage.css'

export function mountLandingPage({ onTryDemo, onGetNow, pageClass = '' }) {
  const root = htmlToElement(`
    <main class="page landing-page ${pageClass}">
      <nav class="landing-nav" aria-label="SIMLIT landing navigation">
        <div class="landing-brand">
          ${iconSvg('bookOpen', 'app-icon landing-brand-icon')}
          <span>SIMLIT</span>
        </div>
        <div class="landing-nav-actions">
          <button id="landing-try-top" type="button" class="landing-link-btn">Try demo</button>
          <button id="landing-get-top" type="button" class="landing-nav-btn">Get now</button>
        </div>
      </nav>

      <section class="landing-hero">
        <div class="landing-hero-copy">
          <h1>Learning should feel less like reading notes and more like touching the idea.</h1>
          <p class="landing-lede">
            SIMLIT turns science, engineering, law, medicine, mathematics, and computing topics into living simulations students can adjust, question, and understand in real time.
          </p>
          <div class="landing-actions">
            <button id="landing-try-main" type="button" class="landing-primary-btn">
              <span>Try now demo</span>
              ${iconSvg('target', 'app-icon')}
            </button>
            <button id="landing-get-main" type="button" class="landing-secondary-btn">
              <span>Get now</span>
              ${iconSvg('briefcase', 'app-icon')}
            </button>
          </div>
        </div>

        <div class="landing-demo-board" aria-label="SIMLIT concept preview">
          <div class="demo-window demo-window-main">
            <div class="demo-window-top">
              <span></span><span></span><span></span>
            </div>
            <div class="demo-learning-desk">
              <div class="demo-sim-panel">
                <div class="demo-orbit">
                  <span class="demo-orbit-path"></span>
                  <span class="demo-orbit-body demo-orbit-body-main"></span>
                  <span class="demo-orbit-body demo-orbit-body-small"></span>
                </div>
                <div class="demo-readout">
                  <span>Force</span>
                  <strong>18.4 N</strong>
                </div>
              </div>
              <div class="demo-note-strip">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="demo-ai-bubble">
                ${iconSvg('brain', 'app-icon')}
                <span>Try lowering the angle.</span>
              </div>
            </div>
          </div>
          <div class="demo-card demo-card-one">
            ${iconSvg('vector', 'app-icon')}
            <span>Live math</span>
          </div>
          <div class="demo-card demo-card-two">
            ${iconSvg('cpu', 'app-icon')}
            <span>Systems lab</span>
          </div>
          <div class="demo-card demo-card-three">
            ${iconSvg('gavel', 'app-icon')}
            <span>Case practice</span>
          </div>
        </div>
      </section>

      <section class="landing-vision">
        <article>
          ${iconSvg('brain', 'app-icon')}
          <h2>The vision</h2>
          <p>Build a learning companion where abstract topics become visible, playful, and testable.</p>
        </article>
        <article>
          ${iconSvg('activity', 'app-icon')}
          <h2>What it is</h2>
          <p>A simulation-first study app with interactive labs, visual models, guided experiments, and subject pathways.</p>
        </article>
        <article>
          ${iconSvg('scale', 'app-icon')}
          <h2>Why it exists</h2>
          <p>Students should not need expensive equipment or perfect explanations before they can explore how a concept behaves.</p>
        </article>
      </section>
    </main>
  `)

  const listeners = [
    [root.querySelector('#landing-try-top'), onTryDemo],
    [root.querySelector('#landing-try-main'), onTryDemo],
    [root.querySelector('#landing-get-top'), onGetNow],
    [root.querySelector('#landing-get-main'), onGetNow],
  ]

  listeners.forEach(([element, handler]) => element?.addEventListener('click', handler))

  return {
    root,
    cleanup() {
      listeners.forEach(([element, handler]) => element?.removeEventListener('click', handler))
    },
  }
}
