import './Simulation.css'

function IframeSimulation({ topic }) {
  // Use the topic ID to load the corresponding HTML file from the public directory
  const htmlSrc = `/${topic?.id}.html`

  return (
    <div className="sim-inner" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
      <iframe 
        src={htmlSrc} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={topic?.label || 'Simulation'}
      />
    </div>
  )
}

export default IframeSimulation
