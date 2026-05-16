import heroImg from '../assets/hero-african.png'
import './WelcomePage.css'

function WelcomePage({ onGetStarted }) {
  return (
    <div className="page welcome-page">
      {/* Header */}
      <header className="welcome-header">
        <div className="logo-group">
          <h1 className="logo-text">SIMLIT</h1>
          <span className="logo-sparkle sparkle-1">✦</span>
          <span className="logo-sparkle sparkle-2">✦</span>
        </div>
        <div className="header-decor">
          <span className="sparkle sparkle-purple">✦</span>
        </div>
      </header>

      {/* Hero text */}
      <section className="hero-section">
        <h2 className="hero-heading">
          Learn<br />smarter.<br />
          <span className="hero-heading-accent">Grow further.</span>
        </h2>
        <p className="hero-subtext">
          Interactive learning<br />for ambitious minds.
        </p>
      </section>

      {/* Hero visual */}
      <section className="hero-visual">
        <div className="circle-bg"></div>
        <img 
          src={heroImg} 
          alt="Student reading a book" 
          className="hero-image"
          draggable="false"
        />

        {/* Floating decorations */}
        <div className="decor star-burst">
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0L33.5 26.5L60 30L33.5 33.5L30 60L26.5 33.5L0 30L26.5 26.5Z" fill="#8b5cf6" />
          </svg>
        </div>
        <div className="decor dot-yellow"></div>
        <div className="decor dot-green"></div>
        <div className="decor square-outline"></div>
        <div className="decor dot-small-orange"></div>
        <div className="decor dash-group">
          <span></span><span></span><span></span>
        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <button id="btn-get-started" className="btn-primary" onClick={onGetStarted}>
          <span>Let's get started</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12H19" />
            <path d="M12 5L19 12L12 19" />
          </svg>
        </button>
        <p className="login-text">
          Already have an account?{' '}
          <button type="button" className="login-link" onClick={() => {}}>Log in</button>
        </p>
      </footer>
    </div>
  )
}

export default WelcomePage
