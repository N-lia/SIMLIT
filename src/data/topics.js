// Topic map keyed by subfield ID.
// Each topic: { id, label, desc, difficulty, emoji, implemented }

export const FIELD_TOPICS = {
  statics: {
    label: 'Statics',
    color: '#fdf2bc',
    topics: [
      { id: 'fbd',         label: 'Free Body Diagram',      desc: 'Visualise forces on a body — sliding vs equilibrium', difficulty: 'Beginner',      emoji: '🧱', implemented: true },
      { id: 'equilibrium', label: 'Equilibrium of Forces',  desc: 'Apply concurrent forces and check resultant = 0',    difficulty: 'Intermediate',  emoji: '⚖️', implemented: true },
      { id: 'truss',       label: 'Truss Analysis',         desc: 'Method of joints: tension & compression members',    difficulty: 'Advanced',      emoji: '🔩', implemented: true },
    ],
  },
  dynamics: {
    label: 'Dynamics',
    color: '#d3e8e1',
    topics: [
      { id: 'newton',     label: "Newton's 2nd Law", desc: 'F = ma Interactive visualizer', difficulty: 'Beginner',      emoji: '🍎', implemented: true },
      { id: 'projectile', label: 'Projectile Motion', desc: 'Launch and trace projectile trajectories',  difficulty: 'Beginner',      emoji: '🚀', implemented: true },
      { id: 'pendulum',   label: 'Simple Pendulum',   desc: 'Oscillation and energy conservation',      difficulty: 'Intermediate',  emoji: '🌀', implemented: true },
      { id: 'collision',  label: 'Collision Sandbox', desc: 'Energy & Momentum Conservation', difficulty: 'Intermediate',  emoji: '💥', implemented: true },
      { id: 'double_pendulum', label: 'Double Pendulum', desc: 'Chaos Onset & Lyapunov Divergence', difficulty: 'Advanced', emoji: '🌀', implemented: true },
      { id: 'wavelab', label: 'Wave Lab', desc: 'Interference & Diffraction FDTD solver', difficulty: 'Advanced', emoji: '🌊', implemented: true },
    ],
  },
  fluid: {
    label: 'Fluid Mechanics',
    color: '#c8e6fa',
    topics: [
      { id: 'bernoulli',   label: "Bernoulli's Principle", desc: 'Pressure-velocity in pipe flow',        difficulty: 'Intermediate', emoji: '💧', implemented: true },
      { id: 'pipeflow',    label: 'Pipe Flow & Losses',    desc: 'Darcy-Weisbach + Minor Losses',         difficulty: 'Advanced',     emoji: '📉', implemented: true },
      { id: 'hydrostatic', label: 'Hydrostatic Pressure',  desc: 'P = P₀ + ρ·g·h | Submerged surfaces',   difficulty: 'Beginner',     emoji: '🌊', implemented: true },
      { id: 'buoyancy',    label: 'Buoyancy',              desc: 'Archimedes principle explorer',         difficulty: 'Beginner',     emoji: '⛵', implemented: false },
    ],
  },
  thermo: {
    label: 'Thermodynamics',
    color: '#fbd0e6',
    topics: [
      { id: 'gas',  label: 'Ideal Gas Law',   desc: 'Interactive PV = nRT particle sim',  difficulty: 'Intermediate', emoji: '🌡️', implemented: true },
      { id: 'heat_engine', label: 'Heat Engine', desc: 'Carnot efficiency and piston dynamics', difficulty: 'Advanced', emoji: '🔥', implemented: true },
      { id: 'heat', label: 'Heat Transfer',   desc: 'Conduction, convection and radiation', difficulty: 'Advanced',    emoji: '🔥', implemented: false },
    ],
  },
  strength: {
    label: 'Strength of Material',
    color: '#d3e8e1',
    topics: [
      { id: 'beam',     label: 'Beam Bending',    desc: 'Live shear, moment & deflection', difficulty: 'Advanced', emoji: '📐', implemented: true },
      { id: 'stress',   label: 'Stress & Strain', desc: 'Material deformation under load', difficulty: 'Intermediate', emoji: '🔩', implemented: true },
      { id: 'torsion',  label: 'Torsion',         desc: 'Twisting of shafts and beams',    difficulty: 'Advanced',     emoji: '🌀', implemented: false },
      { id: 'mohr',     label: "Mohr's Circle",   desc: 'Principal stresses & transformation', difficulty: 'Advanced', emoji: '🎯', implemented: true },
    ],
  },
  circuit: {
    label: 'Circuit Theory',
    color: '#fdf2bc',
    topics: [
      { id: 'ohm', label: "Ohm's Law", desc: 'V = IR interactive circuit explorer', difficulty: 'Beginner',     emoji: '⚡', implemented: true },
      { id: 'kirchhoff', label: "Kirchhoff's Laws", desc: 'Live nodal analysis and circuit solver', difficulty: 'Intermediate', emoji: '🔌', implemented: true },
      { id: 'rc',  label: 'RC Circuit', desc: 'Capacitor charging time constant',   difficulty: 'Intermediate', emoji: '🔋', implemented: false },
      { id: 'motor', label: 'DC Motor Studio', desc: 'Back EMF, Commutation, Thermal & Generator Mode', difficulty: 'Advanced', emoji: '⚙️', implemented: true },
    ],
  },
  math: {
    label: 'Mathematics',
    color: '#dfccf1',
    topics: [
      { id: 'vectors',     label: 'Vector Operations', desc: 'Visualize 2D vector addition',     difficulty: 'Beginner',     emoji: '→',  implemented: false },
      { id: 'derivatives', label: 'Derivatives',       desc: 'Slopes and rates of change',       difficulty: 'Intermediate', emoji: '∫',  implemented: false },
    ],
  },
  cs: {
    label: 'Computer Science',
    color: '#e85d2a',
    topics: [
      { id: 'nand_flash',  label: 'NAND Flash Memory', desc: 'Simulate pages, blocks, erases, and wear leveling', difficulty: 'Intermediate', emoji: '💾', implemented: true },
      { id: 'sorting',      label: 'Sorting Algorithms', desc: 'Visualize bubble, merge, quicksort', difficulty: 'Beginner',     emoji: '📊', implemented: false },
      { id: 'pathfinding',  label: 'Pathfinding',        desc: 'BFS and Dijkstra on graphs',         difficulty: 'Intermediate', emoji: '🔗', implemented: false },
    ],
  },
  law: {
    label: 'Law',
    color: '#faf5ee',
    topics: [
      { id: 'case',     label: 'Case Study Simulator', desc: 'Argue landmark legal cases', difficulty: 'Advanced',     emoji: '⚖️', implemented: true },
      { id: 'courtroom', label: 'Virtual Courtroom', desc: 'Step into the courtroom and present your case', difficulty: 'Advanced', emoji: '🏛️', implemented: true },
      { id: 'contract', label: 'Contract Law',         desc: 'Draft and review contracts', difficulty: 'Intermediate', emoji: '📜', implemented: false },
    ],
  },
  med: {
    label: 'Medicine',
    color: '#e85d2a',
    topics: [
      { id: 'anatomy',       label: 'Human Anatomy',  desc: 'Interactive body systems', difficulty: 'Intermediate', emoji: '🫀', implemented: false },
      { id: 'pharmacology',  label: 'Pharmacology',   desc: 'Drug interaction simulator', difficulty: 'Advanced',    emoji: '💊', implemented: false },
    ],
  },
}

export const DIFFICULTY_COLOR = {
  Beginner:     { bg: 'rgba(42,157,110,0.12)',  text: '#1a7a52' },
  Intermediate: { bg: 'rgba(232,166,48,0.12)', text: '#9a6e00' },
  Advanced:     { bg: 'rgba(217,64,64,0.12)',  text: '#b02020' },
}
