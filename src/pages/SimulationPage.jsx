import { FIELD_TOPICS } from '../data/topics.js'
import { mountComingSoon } from '../simulations/ComingSoon.jsx'
import { iconSvg } from '../utils/icons.js'
import './SimulationPage.css'

const SIM_LOADERS = {
  fbd: () => import('../simulations/statics/FBDSimulation.jsx').then(m => m.mountFBDSimulation),
  equilibrium: () => import('../simulations/statics/EquilibriumSimulation.jsx').then(m => m.mountEquilibriumSimulation),
  truss: () => import('../simulations/statics/TrussSimulation.jsx').then(m => m.mountTrussSimulation),
  newton: () => import('../simulations/NewtonsLawSimulation.jsx').then(m => m.mountNewtonsLawSimulation),
  projectile: () => import('../simulations/ProjectileSimulation.jsx').then(m => m.mountProjectileSimulation),
  pendulum: () => import('../simulations/PendulumSimulation.jsx').then(m => m.mountPendulumSimulation),
  collision: () => import('../simulations/CollisionSimulation.jsx').then(m => m.mountCollisionSimulation),
  double_pendulum: () => import('../simulations/DoublePendulumSimulation.jsx').then(m => m.mountDoublePendulumSimulation),
  beam: () => import('../simulations/BeamSimulation.jsx').then(m => m.mountBeamSimulation),
  ohm: () => import('../simulations/OhmSimulation.jsx').then(m => m.mountOhmSimulation),
  gas: () => import('../simulations/GasSimulation.jsx').then(m => m.mountGasSimulation),
  bernoulli: () => import('../simulations/BernoulliSimulation.jsx').then(m => m.mountBernoulliSimulation),
  pipeflow: () => import('../simulations/PipeFlowSimulation.jsx').then(m => m.mountPipeFlowSimulation),
  hydrostatic: () => import('../simulations/HydrostaticSimulation.jsx').then(m => m.mountHydrostaticSimulation),
  stress: () => import('../simulations/StressStrainSimulation.jsx').then(m => m.mountStressStrainSimulation),
  mohr: () => import('../simulations/MohrsCircleSimulation.jsx').then(m => m.mountMohrsCircleSimulation),
  motor: () => import('../simulations/DcMotorSimulation.jsx').then(m => m.mountDcMotorSimulation),
  nand_flash: () => import('../simulations/NandFlashSimulation.jsx').then(m => m.mountNandFlashSimulation),
  cpu_scheduler: () => import('../simulations/cs/CpuSchedulerSimulation.jsx').then(m => m.mountCpuSchedulerSimulation),
  vectors: () => import('../simulations/VectorAdditionSimulation.jsx').then(m => m.mountVectorAdditionSimulation),
  wavelab: () => import('../simulations/IframeSimulation.jsx').then(m => m.mountIframeSimulation),
  kirchhoff: () => import('../simulations/IframeSimulation.jsx').then(m => m.mountIframeSimulation),
  case: () => import('../simulations/law/LawCasesSimulation.jsx').then(m => m.mountLawCasesSimulation),
  courtroom: () => import('../simulations/law/LawCourtroomSimulation.jsx').then(m => m.mountLawCourtroomSimulation),
  heat_engine: () => import('../simulations/IframeSimulation.jsx').then(m => m.mountIframeSimulation),
}

export function mountSimulationPage({ subfieldId, topicId, onBack, onOpenNotes, pageClass = '' }) {
  const fieldData = FIELD_TOPICS[subfieldId] || {}
  const topic = (fieldData.topics || []).find(t => t.id === topicId) || { id: topicId, label: topicId }
  const loadSimulation = SIM_LOADERS[topicId]

  const root = document.createElement('div')
  root.className = `page sim-page ${pageClass}`
  root.innerHTML = `
    <header class="sim-header">
      <button id="btn-back-sim" class="icon-btn" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/><path d="M12 19L5 12L12 5"/>
        </svg>
      </button>
      <div class="sim-header-center">
        <span class="sim-emoji">${iconSvg(topic.icon)}</span>
        <span class="sim-topic-name">${topic.label || topic.id || topicId}</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="btn-my-notes-sim" class="btn-pill dark" style="padding: 4px 12px; font-size: 13px;">My Notes</button>
        <span class="sim-field-chip">${fieldData.label || ''}</span>
      </div>
    </header>
    <div class="sim-body"></div>
  `

  const simBody = root.querySelector('.sim-body')
  const backButton = root.querySelector('#btn-back-sim')
  backButton.addEventListener('click', onBack)

  const notesButton = root.querySelector('#btn-my-notes-sim')
  if (notesButton && onOpenNotes) {
    notesButton.addEventListener('click', onOpenNotes)
  }

  let result = null
  let disposed = false

  const loading = document.createElement('div')
  loading.className = 'sim-loading'
  loading.textContent = 'Loading simulation...'
  simBody.appendChild(loading)

  if (loadSimulation) {
    loadSimulation()
      .then((mountSimulation) => {
        if (disposed) return
        if (typeof mountSimulation !== 'function') {
          throw new Error(`Simulation "${topicId}" did not export a mount function.`)
        }
        loading.remove()
        result = mountSimulation(simBody, topic)
      })
      .catch((error) => {
        console.error(error)
        if (disposed) return
        if (!loading.isConnected) {
          simBody.appendChild(loading)
        }
        loading.textContent = 'Could not load this simulation.'
      })
  } else {
    loading.remove()
    result = mountComingSoon(simBody, topic)
  }

  const cleanup = () => {
    disposed = true
    backButton.removeEventListener('click', onBack)
    if (notesButton && onOpenNotes) notesButton.removeEventListener('click', onOpenNotes)
    if (typeof result === 'function') {
      result()
    } else if (result && typeof result.cleanup === 'function') {
      result.cleanup()
    }
  }

  return { root, cleanup }
}
