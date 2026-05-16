import { htmlToElement } from '../../utils/dom.js'
import './LawCourtroomSimulation.css'

export function mountLawCourtroomSimulation(container) {
  const root = htmlToElement(`
    <div class="court-sim-container">
      
      {/* TOP HEADER */}
      <header className="court-top-header">
        <button className="court-menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className="court-logo">
          <div className="court-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2c2a28" strokeWidth="1.5">
              <path d="M12 3v18M8 8l4-5 4 5M6 8v4c0 3 2 6 6 6s6-3 6-6V8M4 10h16" />
            </svg>
          </div>
          <div className="court-logo-text">
            <h2>Legal Simulator</h2>
            <span>Nigerian Law Training</span>
          </div>
        </div>

        <div className="court-notif">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <div className="court-notif-badge">3</div>
        </div>
      </header>

      <main className="court-content">
        
        {/* HEADER SECTION */}
        <div className="court-header-section">
          <div className="court-title-area">
            <h1>COURTROOM</h1>
            <p>Step into the courtroom. Present your case. Defend your client. Seek justice.</p>
          </div>
          <button className="court-today-btn">
            TODAY
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        </div>

        {/* SCHEDULE CARD */}
        <div className="court-schedule-card">
          <div className="court-schedule-header">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            TODAY'S SCHEDULE
          </div>
          
          <div className="court-schedule-body">
            <div className="court-timeline">
              <div className="court-timeline-item">
                <div className="court-timeline-dot red"></div>
                <div className="court-timeline-time">10:00 AM</div>
                <h4 className="court-timeline-title">People v. John Doe</h4>
                <p className="court-timeline-desc">Cross Examination<br/>Courtroom 3</p>
              </div>
              
              <div className="court-timeline-item blue">
                <div className="court-timeline-dot"></div>
                <div className="court-timeline-time">11:30 AM</div>
                <h4 className="court-timeline-title">State v. Ahmed Yusuf</h4>
                <p className="court-timeline-desc">Hearing<br/>Courtroom 1</p>
              </div>
              
              <div className="court-timeline-item green">
                <div className="court-timeline-dot blue"></div>
                <div className="court-timeline-time">2:00 PM</div>
                <h4 className="court-timeline-title">Emeka &amp; Co. v. ABC Ltd</h4>
                <p className="court-timeline-desc">Application<br/>Courtroom 2</p>
              </div>
            </div>
            
            <div className="court-sketch-area">
              <svg className="court-sketch-img" viewBox="0 0 200 150">
                {/* Simplified sketchy representation of the courtroom image */}
                <rect x="10" y="50" width="180" height="90" fill="none" stroke="#2c2a28" strokeWidth="1" />
                <rect x="60" y="70" width="80" height="30" fill="none" stroke="#2c2a28" strokeWidth="1" />
                <path d="M 80 40 L 120 40 L 120 70 L 80 70 Z" fill="none" stroke="#2c2a28" strokeWidth="1" />
                {/* Flag */}
                <line x1="40" y1="40" x2="40" y2="70" stroke="#2c2a28" />
                <polygon points="40,40 50,55 40,70" fill="rgba(75, 139, 75, 0.4)" stroke="#2c2a28" />
                {/* Coat of arms placeholder */}
                <circle cx="100" cy="25" r="10" fill="none" stroke="#2c2a28" />
                <path d="M 85 25 Q 100 10 115 25 Q 100 40 85 25" fill="none" stroke="#2c2a28" />
                {/* Benches */}
                <rect x="20" y="110" width="40" height="30" fill="none" stroke="#2c2a28" />
                <rect x="140" y="110" width="40" height="30" fill="none" stroke="#2c2a28" />
              </svg>
            </div>
          </div>
          
          <div className="court-view-schedule">VIEW FULL SCHEDULE &rarr;</div>
        </div>

        {/* COURT STATUS */}
        <div className="court-status-card">
          <div className="court-status-left">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M14 13l-4 4-4-4 4-4 4 4z"/><path d="M14 13l6-6"/><path d="M17 4l3 3"/><path d="M6 15l-4 4"/><path d="M22 22H14"/>
            </svg>
            COURT STATUS
          </div>
          <div className="court-status-right">
            <div className="court-status-stat">
              <span>Active Hearings</span>
              <strong>2</strong>
            </div>
            <div className="court-status-stat">
              <span>Upcoming</span>
              <strong>1</strong>
            </div>
          </div>
        </div>

        {/* ACTIVE CASES */}
        <div className="court-section-header">
          <h3>ACTIVE CASES IN COURT</h3>
          <a href="#">View all &rarr;</a>
        </div>
        
        <div className="court-cases-list">
          <div className="court-case-item">
            <div className="court-folder-icon red"></div>
            <div className="court-case-info">
              <h4>People v. John Doe</h4>
              <p>Criminal Case &bull; Courtroom 3</p>
            </div>
            <span className="court-case-badge in-progress">IN PROGRESS</span>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          
          <div className="court-case-item">
            <div className="court-folder-icon blue"></div>
            <div className="court-case-info">
              <h4>State v. Ahmed Yusuf</h4>
              <p>Criminal Case &bull; Courtroom 1</p>
            </div>
            <span className="court-case-badge in-progress blue">IN PROGRESS</span>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          
          <div className="court-case-item">
            <div className="court-folder-icon green"></div>
            <div className="court-case-info">
              <h4>Emeka &amp; Co. v. ABC Ltd</h4>
              <p>Commercial Case &bull; Courtroom 2</p>
            </div>
            <span className="court-case-badge up-next">UP NEXT</span>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        {/* COURTROOM TOOLS */}
        <div className="court-section-header">
          <h3>COURTROOM TOOLS</h3>
        </div>
        
        <div className="court-tools-grid">
          <button className="court-tool-btn">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="16" cy="10" r="1"/></svg>
            Objection Guide
          </button>
          
          <button className="court-tool-btn">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Evidence Rules
          </button>
          
          <button className="court-tool-btn">
            <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Procedure Checklists
          </button>
          
          <button className="court-tool-btn">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Courtroom Etiquette
          </button>
          
          <button className="court-tool-btn">
            <svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1.5.5 1.5 1.5L5 21h-2z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.5c0 1-.5 1.5-1.5 1.5L17 21h-2z"/></svg>
            Citations Helper
          </button>
          
          <button className="court-tool-btn">
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Full Toolkit &rarr;
          </button>
        </div>
      </main>

      {/* BOTTOM NAVIGATION (Mobile-style) */}
      <nav className="court-bottom-nav">
        <button className="court-nav-item">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Dashboard
        </button>
        <button className="court-nav-item">
          <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Cases
        </button>
        <button className="court-nav-item active">
          <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
          Courtroom
        </button>
        <button className="court-nav-item">
          <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>
          Progress
        </button>
        <button className="court-nav-item">
          <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Library
        </button>
      </nav>
      
    </div>
  `)
  container.appendChild(root)
  return () => {
    if (container.contains(root)) container.removeChild(root)
  }
}
