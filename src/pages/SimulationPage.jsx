import { FIELD_TOPICS } from '../data/topics.js'
import { mountComingSoon } from '../simulations/ComingSoon.jsx'
import { iconSvg } from '../utils/icons.js'
import './SimulationPage.css'

const SIM_LOADERS = {
  // Statics (engineering/statics)
  fbd:            () => import('../simulations/engineering/statics/FBDSimulation.jsx').then(m => m.mountFBDSimulation),
  equilibrium:    () => import('../simulations/engineering/statics/EquilibriumSimulation.jsx').then(m => m.mountEquilibriumSimulation),
  truss:          () => import('../simulations/engineering/statics/TrussSimulation.jsx').then(m => m.mountTrussSimulation),
  // Dynamics (engineering/dynamics)
  newton:         () => import('../simulations/engineering/dynamics/NewtonsLawSimulation.jsx').then(m => m.mountNewtonsLawSimulation),
  pendulum:       () => import('../simulations/engineering/dynamics/PendulumSimulation.jsx').then(m => m.mountPendulumSimulation),
  double_pendulum:() => import('../simulations/engineering/dynamics/DoublePendulumSimulation.jsx').then(m => m.mountDoublePendulumSimulation),
  // Fluid (engineering/fluid)
  bernoulli:      () => import('../simulations/engineering/fluid/BernoulliSimulation.jsx').then(m => m.mountBernoulliSimulation),
  pipeflow:       () => import('../simulations/engineering/fluid/PipeFlowSimulation.jsx').then(m => m.mountPipeFlowSimulation),
  hydrostatic:    () => import('../simulations/engineering/fluid/HydrostaticSimulation.jsx').then(m => m.mountHydrostaticSimulation),
  gas:            () => import('../simulations/engineering/fluid/GasSimulation.jsx').then(m => m.mountGasSimulation),
  // Strength of Material (engineering/strength)
  beam:           () => import('../simulations/engineering/strength/BeamSimulation.jsx').then(m => m.mountBeamSimulation),
  stress:         () => import('../simulations/engineering/strength/StressStrainSimulation.jsx').then(m => m.mountStressStrainSimulation),
  mohr:           () => import('../simulations/engineering/strength/MohrsCircleSimulation.jsx').then(m => m.mountMohrsCircleSimulation),
  // Circuit (engineering/circuit)
  ohm:            () => import('../simulations/engineering/circuit/OhmSimulation.jsx').then(m => m.mountOhmSimulation),
  motor:          () => import('../simulations/engineering/circuit/DcMotorSimulation.jsx').then(m => m.mountDcMotorSimulation),
  // Math (engineering/math)
  vectors:        () => import('../simulations/engineering/math/VectorAdditionSimulation.jsx').then(m => m.mountVectorAdditionSimulation),
  // Computer Science (cs)
  nand_flash:     () => import('../simulations/cs/NandFlashSimulation.jsx').then(m => m.mountNandFlashSimulation),
  cpu_scheduler:  () => import('../simulations/cs/CpuSchedulerSimulation.jsx').then(m => m.mountCpuSchedulerSimulation),
  // Law (law)
  case:           () => import('../simulations/law/LawCasesSimulation.jsx').then(m => m.mountLawCasesSimulation),
  courtroom:      () => import('../simulations/law/LawCourtroomSimulation.jsx').then(m => m.mountLawCourtroomSimulation),
  // Health (health)
  health_cases:   () => import('../simulations/health/HealthCasesSimulation.jsx').then(m => m.mountHealthCasesSimulation),
  clinical_room:  () => import('../simulations/health/HealthClinicalRoomSimulation.jsx').then(m => m.mountHealthClinicalRoomSimulation),
  diagnostic_room:() => import('../simulations/health/DiagnosticRoomSimulation.jsx').then(m => m.mountDiagnosticRoomSimulation),
  // Medicine (med)
  anatomy:        () => import('../simulations/med/AnatomyDeckSimulation.jsx').then(m => m.mountAnatomyDeckSimulation),
  // Iframe-based simulations
  wavelab:        () => import('../simulations/IframeSimulation.jsx').then(m => m.mountIframeSimulation),
  kirchhoff:      () => import('../simulations/IframeSimulation.jsx').then(m => m.mountIframeSimulation),
  heat_engine:    () => import('../simulations/IframeSimulation.jsx').then(m => m.mountIframeSimulation),
}

export function mountSimulationPage({ subfieldId, topicId, onBack, onOpenNotes, onOpenLawCourtroom, selectedLawCaseId, pageClass = '' }) {
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
        <button id="btn-sim-lifecycle" class="sim-lifecycle-btn running" type="button">Stop</button>
        <button id="btn-my-notes-sim" class="btn-pill dark" style="padding: 4px 12px; font-size: 13px;">My Notes</button>
        <span class="sim-field-chip">${fieldData.label || ''}</span>
      </div>
    </header>
    <div class="sim-body"></div>
  `

  const simBody = root.querySelector('.sim-body')
  const backButton = root.querySelector('#btn-back-sim')
  backButton.addEventListener('click', onBack)
  const lifecycleButton = root.querySelector('#btn-sim-lifecycle')

  const notesButton = root.querySelector('#btn-my-notes-sim')
  if (notesButton && onOpenNotes) {
    notesButton.addEventListener('click', onOpenNotes)
  }

  let result = null
  let disposed = false
  let running = false
  let mountToken = 0

  function cleanupResult() {
    if (typeof result === 'function') {
      result()
    } else if (result && typeof result.cleanup === 'function') {
      result.cleanup()
    }
    result = null
  }

  function syncLifecycleButton() {
    if (!lifecycleButton) return
    lifecycleButton.textContent = running ? 'Stop' : 'Start'
    lifecycleButton.classList.toggle('running', running)
    lifecycleButton.classList.toggle('stopped', !running)
    lifecycleButton.setAttribute('aria-pressed', running ? 'true' : 'false')
  }

  function renderStoppedState() {
    simBody.innerHTML = `
      <div class="sim-stopped-state">
        <strong>Simulation stopped</strong>
        <span>Press Start to reload this activity. Background motion has been killed.</span>
      </div>
    `
  }

  function stopSimulation({ showStopped = true } = {}) {
    mountToken += 1
    running = false
    cleanupResult()
    simBody.innerHTML = ''
    if (showStopped && !disposed) renderStoppedState()
    syncLifecycleButton()
  }

  function startSimulation() {
    if (disposed || running) return
    const token = ++mountToken
    running = true
    cleanupResult()
    simBody.innerHTML = ''
    syncLifecycleButton()

    const loading = document.createElement('div')
    loading.className = 'sim-loading'
    loading.textContent = 'Loading simulation...'
    simBody.appendChild(loading)

    if (loadSimulation) {
      loadSimulation()
        .then((mountSimulation) => {
          if (disposed || token !== mountToken || !running) return
          if (typeof mountSimulation !== 'function') {
            throw new Error(`Simulation "${topicId}" did not export a mount function.`)
          }
          loading.remove()
          result = mountSimulation(simBody, topic, {
            onOpenLawCourtroom,
            selectedLawCaseId,
          })
        })
        .catch((error) => {
          console.error(error)
          if (disposed || token !== mountToken) return
          running = false
          syncLifecycleButton()
          if (!loading.isConnected) {
            simBody.appendChild(loading)
          }
          loading.textContent = 'Could not load this simulation.'
        })
    } else {
      loading.remove()
      result = mountComingSoon(simBody, topic)
    }
  }

  function handleLifecycleClick() {
    if (running) {
      stopSimulation()
    } else {
      startSimulation()
    }
  }

  lifecycleButton?.addEventListener('click', handleLifecycleClick)
  window.addEventListener('pagehide', stopSimulation)
  startSimulation()

  const cleanup = () => {
    disposed = true
    stopSimulation({ showStopped: false })
    backButton.removeEventListener('click', onBack)
    lifecycleButton?.removeEventListener('click', handleLifecycleClick)
    if (notesButton && onOpenNotes) notesButton.removeEventListener('click', onOpenNotes)
    window.removeEventListener('pagehide', stopSimulation)
  }

  return { root, cleanup }
}
