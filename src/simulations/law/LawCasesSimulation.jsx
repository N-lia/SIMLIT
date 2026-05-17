import { render } from '../../utils/react-lite.js'
import './LawCasesSimulation.css'

export default function LawCasesSimulation() {
  return (

    <div className="law-sim-container">
      {/* SIDEBAR */}
      <aside className="law-sidebar">
        <div className="law-logo">
          <div className="law-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 3v18M8 8l4-5 4 5M6 8v4c0 3 2 6 6 6s6-3 6-6V8M4 10h16" />
            </svg>
          </div>
          <div className="law-logo-text">
            <h2>Legal<br/>Simulator</h2>
            <span>Nigerian Law Training</span>
          </div>
        </div>

        <nav className="law-nav">
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Dashboard
          </div>
          <div className="law-nav-item active">
            <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Cases
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-4"/></svg>
            My Progress
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Library
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z"/></svg>
            Drafting Lab
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            ADR Room
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
            Moot Court
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Notes
          </div>
          <div className="law-nav-item">
            <svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10l1 7H6l1-7z"/><path d="M5 11v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>
            Leaderboard
          </div>
        </nav>

        <div className="law-goal">
          <h4>Today's Goal</h4>
          <p>Complete any<br/>1 task</p>
          <div className="law-progress-bar">
            <div className="law-progress-fill" style={{ width: '15%' }}></div>
          </div>
          <span className="law-goal-text">0/1</span>
        </div>

        <div className="law-profile">
          <div className="law-avatar">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="law-profile-info">
            <strong>A. OLADELE</strong>
            <span>LL.B Student ⌄</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="law-main">
        <div className="law-header">
          <div className="law-title-area">
            <h1>CASES <span style={{fontSize:'20px'}}></span></h1>
            <p>Practice real legal skills with immersive simulations.</p>
          </div>
          <div className="law-header-actions">
            <button className="law-icon-btn">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button className="law-icon-btn">
              <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="law-tabs-area">
          <div className="law-tabs">
            <button className="law-tab active">ALL CASES</button>
            <button className="law-tab">FAVOURITES</button>
            <button className="law-tab">IN PROGRESS</button>
            <button className="law-tab">COMPLETED</button>
          </div>
          <button className="law-filter-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter ⌄
          </button>
        </div>

        <div className="law-grid">
          {/* Card 1 */}
          <div className="law-folder" data-color="red">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 3v18M8 8l4-5 4 5M6 8v4c0 3 2 6 6 6s6-3 6-6V8M4 10h16" /></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Criminal Trial</h3>
              <p className="law-folder-desc">Conduct a full criminal trial from charge to judgment.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'60%'}}></div></div>
                  <span className="law-folder-pct">60%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="law-folder" data-color="blue">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon shaded">
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Constitutional Rights</h3>
              <p className="law-folder-desc">Enforce fundamental rights and challenge state actions.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'40%'}}></div></div>
                  <span className="law-folder-pct">40%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="law-folder" data-color="green">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon">
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Contract Dispute</h3>
              <p className="law-folder-desc">Analyse facts, review contracts and advise your client.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'25%'}}></div></div>
                  <span className="law-folder-pct">25%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="law-folder" data-color="purple">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon">
                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Client Interview</h3>
              <p className="law-folder-desc">Interview the client and uncover the real story.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'5%'}}></div></div>
                  <span className="law-folder-badge">New</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="law-folder" data-color="orange">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Evidence Lab</h3>
              <p className="law-folder-desc">Examine evidence, spot inconsistencies and build your case.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'30%'}}></div></div>
                  <span className="law-folder-pct">30%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6 */}
          <div className="law-folder" data-color="tan">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon shaded">
                  <svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Negotiation Room</h3>
              <p className="law-folder-desc">Negotiate terms, make strategic offers and reach the best outcome.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <span className="law-folder-badge">New</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 7 */}
          <div className="law-folder" data-color="teal">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon">
                  <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Moot Court</h3>
              <p className="law-folder-desc">Argue an appeal and respond to the bench.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'10%'}}></div></div>
                  <span className="law-folder-pct">10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 8 */}
          <div className="law-folder" data-color="yellow">
            <div className="law-folder-tab"></div>
            <div className="law-folder-body">
              <div className="law-folder-header">
                <div className="law-folder-icon">
                  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div className="law-folder-dots">...</div>
              </div>
              <h3 className="law-folder-title">Property & Land Dispute</h3>
              <p className="law-folder-desc">Resolve land ownership and tenancy conflicts.</p>
              <div className="law-folder-footer">
                <div className="law-folder-progress">
                  <div className="law-folder-bar"><div className="law-folder-fill" style={{width:'15%'}}></div></div>
                  <span className="law-folder-pct">15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="law-bottom-banner">
          <div className="law-banner-text">
            <svg className="law-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 6a6 6 0 0 1 6 6c0 1.9-1.2 3.6-3 4.5V18H9v-1.5c-1.8-.9-3-2.6-3-4.5a6 6 0 0 1 6-6z"/>
            </svg>
            <p>Each case is mapped to Nigerian law curriculum<br/>outcomes and practical skills.</p>
          </div>
          <button className="law-banner-btn">VIEW CURRICULUM MAP &rarr;</button>
        </div>
      </main>
    </div>

  );
}

export function mountLawCasesSimulation(container) {
  const app = render(LawCasesSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}
