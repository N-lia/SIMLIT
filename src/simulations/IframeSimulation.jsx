import './Simulation.css'

export function mountIframeSimulation(container, topic = {}) {
  const root = document.createElement('div')
  root.className = 'sim-inner'
  root.style.padding = '0'
  root.style.overflow = 'hidden'
  root.style.height = '100%'
  root.style.minHeight = '100%'

  const iframe = document.createElement('iframe')
  const simulationId = topic?.id || ''
  iframe.src = `${import.meta.env.BASE_URL}${simulationId}.html`
  iframe.title = topic?.label || 'Simulation'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.minHeight = '100%'
  iframe.style.border = 'none'

  root.appendChild(iframe)
  container.appendChild(root)

  return () => {
    container.removeChild(root)
  }
}
