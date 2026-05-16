import './Simulation.css'

function ComingSoon({ topic }) {
  return (
    <div className="sim-inner coming-soon-wrap">
      <div className="coming-soon-body">
        <div className="coming-soon-emoji">{topic?.emoji || '🔬'}</div>
        <h3 className="coming-soon-title">{topic?.label}</h3>
        <p className="coming-soon-sub">
          This simulation is being built.<br />Check back soon!
        </p>
        <div className="coming-soon-badge">🚧 In Development</div>
      </div>
    </div>
  )
}

export default ComingSoon
