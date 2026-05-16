import { FIELD_TOPICS } from '../data/topics'
import FBDSimulation         from '../simulations/statics/FBDSimulation'
import EquilibriumSimulation from '../simulations/statics/EquilibriumSimulation'
import TrussSimulation       from '../simulations/statics/TrussSimulation'
import ProjectileSimulation  from '../simulations/ProjectileSimulation'
import PendulumSimulation    from '../simulations/PendulumSimulation'
import BeamSimulation        from '../simulations/BeamSimulation'
import OhmSimulation         from '../simulations/OhmSimulation'
import GasSimulation         from '../simulations/GasSimulation'
import BernoulliSimulation   from '../simulations/BernoulliSimulation'
import PipeFlowSimulation    from '../simulations/PipeFlowSimulation'
import HydrostaticSimulation from '../simulations/HydrostaticSimulation'
import StressStrainSimulation from '../simulations/StressStrainSimulation'
import MohrsCircleSimulation from '../simulations/MohrsCircleSimulation'
import NewtonsLawSimulation  from '../simulations/NewtonsLawSimulation'
import DcMotorSimulation     from '../simulations/DcMotorSimulation'
import CollisionSimulation   from '../simulations/CollisionSimulation'
import DoublePendulumSimulation from '../simulations/DoublePendulumSimulation'
import LawCasesSimulation    from '../simulations/law/LawCasesSimulation'
import ComingSoon            from '../simulations/ComingSoon'
import IframeSimulation      from '../simulations/IframeSimulation'
import './SimulationPage.css'

const SIM_MAP = {
  // statics
  fbd:         FBDSimulation,
  equilibrium: EquilibriumSimulation,
  truss:       TrussSimulation,
  // dynamics
  newton:      NewtonsLawSimulation,
  projectile:  ProjectileSimulation,
  pendulum:    PendulumSimulation,
  collision:   CollisionSimulation,
  double_pendulum: DoublePendulumSimulation,
  // others
  beam:        BeamSimulation,
  ohm:         OhmSimulation,
  gas:         GasSimulation,
  bernoulli:   BernoulliSimulation,
  pipeflow:    PipeFlowSimulation,
  hydrostatic: HydrostaticSimulation,
  stress:      StressStrainSimulation,
  mohr:        MohrsCircleSimulation,
  motor:       DcMotorSimulation,
  wavelab:     IframeSimulation,
  kirchhoff:   IframeSimulation,
  case:        LawCasesSimulation,
}

function SimulationPage({ subfieldId, topicId, onBack, pageClass = '' }) {
  const fieldData    = FIELD_TOPICS[subfieldId] || {}
  const topic        = (fieldData.topics || []).find(t => t.id === topicId) || {}
  const SimComponent = SIM_MAP[topicId] || ComingSoon

  return (
    <div className={`page sim-page ${pageClass}`}>
      <header className="sim-header">
        <button id="btn-back-sim" className="icon-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19L5 12L12 5"/>
          </svg>
        </button>
        <div className="sim-header-center">
          <span className="sim-emoji">{topic.emoji}</span>
          <span className="sim-topic-name">{topic.label || topicId}</span>
        </div>
        <span className="sim-field-chip">{fieldData.label || ''}</span>
      </header>

      <div className="sim-body">
        <SimComponent topic={topic} />
      </div>
    </div>
  )
}

export default SimulationPage
