import './Simulation.css'
import { iconSvg } from '../utils/icons.js'

export function mountComingSoon(container, topic = {}) {
  const root = document.createElement('div')
  root.className = 'sim-inner coming-soon-wrap'
  root.innerHTML = `
    <div class="coming-soon-body">
      <div class="coming-soon-emoji">${iconSvg(topic?.icon || 'flask')}</div>
      <h3 class="coming-soon-title">${topic?.label || 'Coming Soon'}</h3>
      <p class="coming-soon-sub">This simulation is being built.<br />Check back soon!</p>
      <div class="coming-soon-badge">${iconSvg('tool', 'app-icon app-icon-inline')} In Development</div>
    </div>
  `
  container.appendChild(root)
  return () => {
    container.removeChild(root)
  }
}
