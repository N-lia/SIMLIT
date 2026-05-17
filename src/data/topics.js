// Topic map keyed by subfield ID.
// Each topic: { id, label, desc, difficulty, icon, implemented }

export const FIELD_TOPICS = {
  statics: {
    cards: [
      {
            "title": "Free Body Diagram",
            "concept": "First Principle",
            "desc": "Isolate the object. By drawing only the object and the external forces acting upon it, you strip away the environment to reveal purely mathematical vectors."
      },
      {
            "title": "Static Equilibrium",
            "concept": "First Principle",
            "desc": "Net force and net moment equal zero. If nothing is accelerating or rotating, all opposing forces and torques must perfectly cancel each other out."
      },
      {
            "title": "Newton's First Law",
            "concept": "First Principle",
            "desc": "Inertia. An object remains at rest unless acted upon by an unbalanced external force. This is the absolute foundation of all statics."
      },
      {
            "title": "Newton's Third Law",
            "concept": "First Principle",
            "desc": "Action and Reaction. For every applied force on a boundary, the boundary pushes back with equal magnitude and opposite direction."
      },
      {
            "title": "Moments (Torque)",
            "concept": "First Principle",
            "desc": "Force times perpendicular distance. It is the measure of a force's tendency to cause a body to rotate about a specific axis or pivot."
      },
      {
            "title": "Couples",
            "concept": "First Principle",
            "desc": "Two equal, opposite, and parallel forces. They produce pure rotation with zero net linear translation, creating a moment independent of the pivot point."
      },
      {
            "title": "Center of Gravity",
            "concept": "First Principle",
            "desc": "The single point where the entire weight of a body can be considered to act. For uniform gravitational fields, it is identical to the center of mass."
      },
      {
            "title": "Centroid",
            "concept": "First Principle",
            "desc": "The geometric center of a shape. It relies purely on the geometry of the object, ignoring mass or density distribution."
      },
      {
            "title": "Friction (Dry)",
            "concept": "First Principle",
            "desc": "Resistance to lateral motion. It is directly proportional to the normal force pressing the surfaces together, up to the point of slipping."
      },
      {
            "title": "Normal Force",
            "concept": "First Principle",
            "desc": "The perpendicular contact force exerted by a surface on an object. It actively adjusts to prevent solid objects from passing through each other."
      },
      {
            "title": "Tension",
            "concept": "First Principle",
            "desc": "The pulling force transmitted axially through a string, cable, or chain. It always pulls away from the object to which it is attached."
      },
      {
            "title": "Compression",
            "concept": "First Principle",
            "desc": "The pushing force transmitted axially through a structural member. It tends to squeeze or shorten the material."
      },
      {
            "title": "Truss Joints",
            "concept": "First Principle",
            "desc": "Pinned connections in a framework. By assuming joints are perfectly pinned, members experience only pure tension or compression, not bending."
      },
      {
            "title": "Method of Joints",
            "concept": "First Principle",
            "desc": "Solving trusses node by node. By isolating a single joint, you apply equilibrium to find the internal forces of connected members."
      },
      {
            "title": "Method of Sections",
            "concept": "First Principle",
            "desc": "Solving trusses by slicing. Cut an imaginary line through the truss and apply equilibrium to the entire severed section to find internal forces quickly."
      },
      {
            "title": "Distributed Loads",
            "concept": "First Principle",
            "desc": "Forces spread over an area or line. To simplify calculations, they are converted into a single equivalent point load acting at the load's centroid."
      },
      {
            "title": "Pulleys",
            "concept": "First Principle",
            "desc": "A wheel on an axle that changes the direction of tension in a cable. Ideal pulleys do not change the magnitude of the tension force."
      },
      {
            "title": "Springs",
            "concept": "First Principle",
            "desc": "Restoring force. Hooke's law dictates that the force exerted by an ideal spring is strictly proportional to its deformation from equilibrium."
      },
      {
            "title": "Two-Force Members",
            "concept": "First Principle",
            "desc": "A body pinned at exactly two points with no other forces. For equilibrium, the two forces must be equal, opposite, and collinear."
      },
      {
            "title": "Zero-Force Members",
            "concept": "First Principle",
            "desc": "Structural components that carry no load under specific conditions. They exist to provide stability or handle alternative load cases."
      }
],
    label: 'Statics',
    color: '#fdf2bc',
    topics: [
      { id: 'fbd',         label: 'Free Body Diagram',      desc: 'Visualise forces on a body — sliding vs equilibrium', difficulty: 'Beginner',      icon: 'box', implemented: true },
      { id: 'equilibrium', label: 'Equilibrium of Forces',  desc: 'Apply concurrent forces and check resultant = 0',    difficulty: 'Intermediate',  icon: 'balance', implemented: true },
      { id: 'truss',       label: 'Truss Analysis',         desc: 'Method of joints: tension & compression members',    difficulty: 'Advanced',      icon: 'gitBranch', implemented: true },
    ],
  },
  dynamics: {
    cards: [
      {
            "title": "Kinematics",
            "concept": "First Principle",
            "desc": "The geometry of motion. It describes how things move (position, velocity, acceleration) without concerning itself with the forces causing that motion."
      },
      {
            "title": "Kinetics",
            "concept": "First Principle",
            "desc": "The physics of motion. It bridges the gap between the forces applied to a mass and the resulting kinematic acceleration."
      },
      {
            "title": "Newton's Second Law",
            "concept": "First Principle",
            "desc": "F = ma. An unbalanced force applied to a mass fundamentally manifests as an acceleration directly proportional to that force."
      },
      {
            "title": "Velocity",
            "concept": "First Principle",
            "desc": "The rate of change of position. It is a vector, meaning moving at constant speed in a circle still constitutes a changing velocity."
      },
      {
            "title": "Acceleration",
            "concept": "First Principle",
            "desc": "The rate of change of velocity. Any change in speed or direction means an acceleration is occurring."
      },
      {
            "title": "Work",
            "concept": "First Principle",
            "desc": "Force applied over a distance. It represents the actual energy transferred to or from an object by a force acting along its path of motion."
      },
      {
            "title": "Kinetic Energy",
            "concept": "First Principle",
            "desc": "The energy of motion (1/2 mv^2). It is the work required to accelerate a mass from rest to its current velocity."
      },
      {
            "title": "Potential Energy",
            "concept": "First Principle",
            "desc": "Stored energy based on position. It is the work done by conservative forces (like gravity or springs) when moving an object."
      },
      {
            "title": "Conservation of Energy",
            "concept": "First Principle",
            "desc": "Energy cannot be created or destroyed. In a closed system without friction, the sum of kinetic and potential energy remains perfectly constant."
      },
      {
            "title": "Momentum",
            "concept": "First Principle",
            "desc": "Mass in motion (p = mv). It is a vector quantity that represents the \"unstoppability\" of an object."
      },
      {
            "title": "Impulse",
            "concept": "First Principle",
            "desc": "Force applied over time. A large force over a short time (a hammer strike) changes momentum exactly as much as a small force over a long time."
      },
      {
            "title": "Conservation of Momentum",
            "concept": "First Principle",
            "desc": "In the absence of external forces, the total momentum of a system before an event (like a collision) perfectly equals the total momentum after."
      },
      {
            "title": "Elastic Collisions",
            "concept": "First Principle",
            "desc": "Bouncing perfectly. Both momentum and total kinetic energy are conserved; objects bounce off each other with no loss of speed."
      },
      {
            "title": "Inelastic Collisions",
            "concept": "First Principle",
            "desc": "Sticking or deforming. Momentum is conserved, but kinetic energy is lost to heat, sound, or permanent structural deformation."
      },
      {
            "title": "Angular Velocity",
            "concept": "First Principle",
            "desc": "The rate of rotation. It describes how fast an object sweeps through an angle, analogous to linear speed but in a circle."
      },
      {
            "title": "Centripetal Acceleration",
            "concept": "First Principle",
            "desc": "The inward acceleration required to keep an object moving in a circle. Without it, the object would instantly fly off in a straight tangent line."
      },
      {
            "title": "Coriolis Effect",
            "concept": "First Principle",
            "desc": "An apparent deflection of moving objects when viewed from a rotating reference frame, resulting from the conservation of angular momentum."
      },
      {
            "title": "Simple Harmonic Motion",
            "concept": "First Principle",
            "desc": "A restoring force proportional to displacement. It results in perpetual, perfect sinusoidal oscillation, like a pendulum or spring."
      },
      {
            "title": "Damping",
            "concept": "First Principle",
            "desc": "The extraction of energy from an oscillating system. Friction or drag gradually reduces the amplitude of motion over time."
      },
      {
            "title": "Resonance",
            "concept": "First Principle",
            "desc": "Driving a system at its natural frequency. The system absorbs maximum energy, leading to wildly increasing amplitudes of vibration."
      }
],
    label: 'Dynamics',
    color: '#d3e8e1',
    topics: [
      { id: 'newton',     label: "Newton's 2nd Law", desc: 'F = ma Interactive visualizer', difficulty: 'Beginner',      icon: 'activity', implemented: true },
      { id: 'projectile', label: 'Projectile Motion', desc: 'Launch and trace projectile trajectories',  difficulty: 'Beginner',      icon: 'target', implemented: true },
      { id: 'pendulum',   label: 'Simple Pendulum',   desc: 'Oscillation and energy conservation',      difficulty: 'Intermediate',  icon: 'clock', implemented: true },
      { id: 'collision',  label: 'Collision Sandbox', desc: 'Energy & Momentum Conservation', difficulty: 'Intermediate',  icon: 'atom', implemented: true },
      { id: 'double_pendulum', label: 'Double Pendulum', desc: 'Chaos Onset & Lyapunov Divergence', difficulty: 'Advanced', icon: 'clock', implemented: true },
      { id: 'wavelab', label: 'Wave Lab', desc: 'Interference & Diffraction FDTD solver', difficulty: 'Advanced', icon: 'waves', implemented: true },
    ],
  },
  fluid: {
    cards: [
      {
            "title": "Continuum Assumption",
            "concept": "First Principle",
            "desc": "Fluids are treated as continuous matter rather than discrete molecules. This allows us to define macroscopic properties like pressure and density at any point."
      },
      {
            "title": "Density",
            "concept": "First Principle",
            "desc": "Mass per unit volume. It dictates the inertia of the fluid and fundamentally determines buoyancy forces."
      },
      {
            "title": "Viscosity",
            "concept": "First Principle",
            "desc": "Internal fluid friction. It represents the reluctance of fluid layers to slide past one another, causing resistance to flow."
      },
      {
            "title": "Hydrostatic Pressure",
            "concept": "First Principle",
            "desc": "Pressure in a static fluid increases linearly with depth due to the accumulated weight of the fluid above."
      },
      {
            "title": "Pascal's Principle",
            "concept": "First Principle",
            "desc": "A pressure change applied to a confined incompressible fluid is transmitted undiminished to every portion of the fluid."
      },
      {
            "title": "Archimedes' Principle",
            "concept": "First Principle",
            "desc": "Buoyancy. An object submerged in a fluid experiences an upward buoyant force perfectly equal to the weight of the fluid it displaces."
      },
      {
            "title": "Continuity Equation",
            "concept": "First Principle",
            "desc": "Conservation of mass in steady flow. If a pipe narrows, an incompressible fluid must speed up to maintain the same volumetric flow rate (A1V1 = A2V2)."
      },
      {
            "title": "Bernoulli's Equation",
            "concept": "First Principle",
            "desc": "Conservation of energy along a streamline. Pressure, kinetic energy, and potential energy trade off; faster moving fluids exert lower pressure."
      },
      {
            "title": "Laminar Flow",
            "concept": "First Principle",
            "desc": "Smooth, orderly fluid motion in parallel layers. Occurs at low velocities where viscous forces strongly dominate."
      },
      {
            "title": "Turbulent Flow",
            "concept": "First Principle",
            "desc": "Chaotic, highly mixing fluid motion with eddies. Occurs at high velocities where inertial forces overpower viscous damping."
      },
      {
            "title": "Reynolds Number",
            "concept": "First Principle",
            "desc": "The ratio of inertial forces to viscous forces. A dimensionless number that predicts whether flow will be laminar or turbulent."
      },
      {
            "title": "Boundary Layer",
            "concept": "First Principle",
            "desc": "The thin layer of fluid near a solid surface where velocity drops from the free-stream value down to absolutely zero due to friction."
      },
      {
            "title": "No-Slip Condition",
            "concept": "First Principle",
            "desc": "At a solid boundary, the fluid velocity is exactly equal to the boundary velocity. Fluids stick to surfaces."
      },
      {
            "title": "Flow Separation",
            "concept": "First Principle",
            "desc": "When the boundary layer detaches from a surface due to an adverse pressure gradient, creating a large, drag-inducing wake."
      },
      {
            "title": "Drag Force",
            "concept": "First Principle",
            "desc": "The resistance force exerted by a fluid parallel to the direction of motion. It stems from both surface friction and pressure differences (form drag)."
      },
      {
            "title": "Lift Force",
            "concept": "First Principle",
            "desc": "The force exerted by a fluid perpendicular to the direction of motion, typically created by deflecting the flow downward."
      },
      {
            "title": "Mach Number",
            "concept": "First Principle",
            "desc": "The ratio of flow velocity to the local speed of sound. It dictates the onset of compressibility effects and shock waves."
      },
      {
            "title": "Stagnation Point",
            "concept": "First Principle",
            "desc": "A point in a flow field where the fluid velocity is brought to exactly zero, converting all its kinetic energy into maximum pressure."
      },
      {
            "title": "Vorticity",
            "concept": "First Principle",
            "desc": "The local spinning motion of fluid particles. It is a microscopic measure of rotation within the flow field."
      },
      {
            "title": "Navier-Stokes Equations",
            "concept": "First Principle",
            "desc": "The fundamental governing equations of fluid motion, representing the application of Newton's Second Law to viscous, continuous fluids."
      }
],
    label: 'Fluid Mechanics',
    color: '#c8e6fa',
    topics: [
      { id: 'bernoulli',   label: "Bernoulli's Principle", desc: 'Pressure-velocity in pipe flow',        difficulty: 'Intermediate', icon: 'waves', implemented: true },
      { id: 'pipeflow',    label: 'Pipe Flow & Losses',    desc: 'Darcy-Weisbach + Minor Losses',         difficulty: 'Advanced',     icon: 'barChart', implemented: true },
      { id: 'hydrostatic', label: 'Hydrostatic Pressure',  desc: 'P = P₀ + ρ·g·h | Submerged surfaces',   difficulty: 'Beginner',     icon: 'waves', implemented: true },
      { id: 'buoyancy',    label: 'Buoyancy',              desc: 'Archimedes principle explorer',         difficulty: 'Beginner',     icon: 'anchor', implemented: false },
    ],
  },
  thermo: {
    cards: [
      {
            "title": "System and Surroundings",
            "concept": "First Principle",
            "desc": "The fundamental boundary. A system is the region of space under study, and the surroundings are everything else interacting with it."
      },
      {
            "title": "State Variables",
            "concept": "First Principle",
            "desc": "Properties that depend only on the current condition of the system (like Temperature or Pressure), completely independent of the path taken to get there."
      },
      {
            "title": "Temperature",
            "concept": "First Principle",
            "desc": "A macroscopic measure of the average microscopic kinetic energy of particles in a substance."
      },
      {
            "title": "Heat",
            "concept": "First Principle",
            "desc": "Energy in transit across a boundary due strictly to a macroscopic temperature difference."
      },
      {
            "title": "Work (Thermo)",
            "concept": "First Principle",
            "desc": "Energy transfer across a boundary not driven by a temperature difference, typically associated with macroscopic volume expansion or shaft rotation."
      },
      {
            "title": "Zeroth Law",
            "concept": "First Principle",
            "desc": "Thermal equilibrium. If A is in equilibrium with B, and B with C, then A is in thermal equilibrium with C. This defines temperature."
      },
      {
            "title": "First Law",
            "concept": "First Principle",
            "desc": "Conservation of energy. The change in internal energy of a system equals the heat added to it minus the work done by it."
      },
      {
            "title": "Internal Energy",
            "concept": "First Principle",
            "desc": "The total microscopic kinetic and potential energy of all the molecules within a system."
      },
      {
            "title": "Enthalpy",
            "concept": "First Principle",
            "desc": "A convenient grouping of internal energy plus flow work (U + PV), highly useful for analyzing open flowing systems."
      },
      {
            "title": "Specific Heat",
            "concept": "First Principle",
            "desc": "The amount of heat energy required to raise the temperature of one unit mass of a substance by one degree."
      },
      {
            "title": "Second Law",
            "concept": "First Principle",
            "desc": "The law of entropy. Heat naturally flows from hot to cold, and the total disorder (entropy) of an isolated system will always increase over time."
      },
      {
            "title": "Entropy",
            "concept": "First Principle",
            "desc": "A measure of microscopic disorder, or the number of specific ways a system can be arranged. It quantifies the irreversibility of a process."
      },
      {
            "title": "Reversible Process",
            "concept": "First Principle",
            "desc": "An idealized process that occurs infinitely slowly with no friction or loss, meaning it can be perfectly reversed without leaving a trace on the universe."
      },
      {
            "title": "Carnot Cycle",
            "concept": "First Principle",
            "desc": "The theoretically most efficient heat engine cycle possible, bounded strictly by the temperatures of the hot and cold reservoirs."
      },
      {
            "title": "Ideal Gas Law",
            "concept": "First Principle",
            "desc": "PV = nRT. An equation of state assuming gas particles take up zero volume and exert zero intermolecular attractive forces."
      },
      {
            "title": "Isobaric Process",
            "concept": "First Principle",
            "desc": "A thermodynamic process occurring at perfectly constant pressure."
      },
      {
            "title": "Isochoric Process",
            "concept": "First Principle",
            "desc": "A thermodynamic process occurring at perfectly constant volume, meaning zero boundary work is done."
      },
      {
            "title": "Isothermal Process",
            "concept": "First Principle",
            "desc": "A thermodynamic process occurring at constant temperature, often requiring very slow heat transfer to the surroundings."
      },
      {
            "title": "Adiabatic Process",
            "concept": "First Principle",
            "desc": "A rapid or heavily insulated process where absolutely no heat is exchanged with the surroundings (Q = 0)."
      },
      {
            "title": "Phase Change",
            "concept": "First Principle",
            "desc": "A transition between solid, liquid, or gas. During a pure phase change, heat is absorbed or released while temperature remains strictly constant."
      }
],
    label: 'Thermodynamics',
    color: '#fbd0e6',
    topics: [
      { id: 'gas',  label: 'Ideal Gas Law',   desc: 'Interactive PV = nRT particle sim',  difficulty: 'Intermediate', icon: 'thermometer', implemented: true },
      { id: 'heat_engine', label: 'Heat Engine', desc: 'Carnot efficiency and piston dynamics', difficulty: 'Advanced', icon: 'flame', implemented: true },
      { id: 'heat', label: 'Heat Transfer',   desc: 'Conduction, convection and radiation', difficulty: 'Advanced',    icon: 'flame', implemented: false },
    ],
  },
  strength: {
    cards: [
      {
            "title": "Normal Stress",
            "concept": "First Principle",
            "desc": "Force applied perpendicular to a cross-section, divided by that area. It actively pulls (tension) or pushes (compression) the molecules apart."
      },
      {
            "title": "Shear Stress",
            "concept": "First Principle",
            "desc": "Force applied parallel to a cross-section, divided by that area. It causes planes of molecules to slide past one another."
      },
      {
            "title": "Normal Strain",
            "concept": "First Principle",
            "desc": "The dimensionless measure of deformation. It is the change in length divided by the original, unloaded length."
      },
      {
            "title": "Shear Strain",
            "concept": "First Principle",
            "desc": "The angular distortion of an element. It measures how much a perfect right angle has been skewed by shear forces."
      },
      {
            "title": "Hooke's Law",
            "concept": "First Principle",
            "desc": "In the elastic region, stress is strictly and linearly proportional to strain. This slope is the material's stiffness."
      },
      {
            "title": "Young's Modulus",
            "concept": "First Principle",
            "desc": "The modulus of elasticity. A fundamental material property defining how much a material resists axial stretching or compression."
      },
      {
            "title": "Shear Modulus",
            "concept": "First Principle",
            "desc": "The modulus of rigidity. A material property defining how strongly a material resists shearing or twisting distortions."
      },
      {
            "title": "Poisson's Ratio",
            "concept": "First Principle",
            "desc": "When you stretch a material axially, it naturally thins out laterally. This ratio defines that transverse contraction relative to longitudinal extension."
      },
      {
            "title": "Yield Strength",
            "concept": "First Principle",
            "desc": "The absolute limit of elastic behavior. Passing this stress level means the material will permanently deform and not return to its original shape."
      },
      {
            "title": "Ultimate Strength",
            "concept": "First Principle",
            "desc": "The absolute maximum engineering stress a material can withstand before necking and impending catastrophic fracture."
      },
      {
            "title": "Ductility",
            "concept": "First Principle",
            "desc": "A material's ability to absorb energy and plastically deform significantly before final fracture (like copper vs glass)."
      },
      {
            "title": "Factor of Safety",
            "concept": "First Principle",
            "desc": "The ratio of a material's failure strength to the maximum expected operating stress. It is the buffer against uncertainty."
      },
      {
            "title": "Torsion",
            "concept": "First Principle",
            "desc": "The twisting of a structural member around its longitudinal axis, generating internal shear stresses that are maximum at the outer surface."
      },
      {
            "title": "Bending Moment",
            "concept": "First Principle",
            "desc": "The internal reaction to transverse loads that causes a beam to curve, creating tension on one face and compression on the opposite face."
      },
      {
            "title": "Neutral Axis",
            "concept": "First Principle",
            "desc": "The specific plane running longitudinally through a bending beam that experiences absolutely zero normal stress and zero strain."
      },
      {
            "title": "Moment of Inertia",
            "concept": "First Principle",
            "desc": "The geometric property of a cross-section that dictates its resistance to bending. Distributing material further from the center greatly increases stiffness."
      },
      {
            "title": "Transverse Shear",
            "concept": "First Principle",
            "desc": "Internal shear forces generated in bending beams, maximum at the neutral axis and zero at the extreme top and bottom edges."
      },
      {
            "title": "Principal Stresses",
            "concept": "First Principle",
            "desc": "The absolute maximum and minimum normal stresses acting on an element when rotated to an angle where all shear stresses become zero."
      },
      {
            "title": "Mohr's Circle",
            "concept": "First Principle",
            "desc": "A graphical representation of the stress state at a point, elegantly rotating coordinate axes to find principal and maximum shear stresses."
      },
      {
            "title": "Buckling",
            "concept": "First Principle",
            "desc": "A sudden, catastrophic geometric instability in slender columns under compression, failing long before the material's yield strength is reached."
      }
],
    label: 'Strength of Material',
    color: '#d3e8e1',
    topics: [
      { id: 'beam',     label: 'Beam Bending',    desc: 'Live shear, moment & deflection', difficulty: 'Advanced', icon: 'ruler', implemented: true },
      { id: 'stress',   label: 'Stress & Strain', desc: 'Material deformation under load', difficulty: 'Intermediate', icon: 'tool', implemented: true },
      { id: 'torsion',  label: 'Torsion',         desc: 'Twisting of shafts and beams',    difficulty: 'Advanced',     icon: 'activity', implemented: false },
      { id: 'mohr',     label: "Mohr's Circle",   desc: 'Principal stresses & transformation', difficulty: 'Advanced', icon: 'target', implemented: true },
    ],
  },
  circuit: {
    cards: [
      {
            "title": "Electric Charge",
            "concept": "First Principle",
            "desc": "The fundamental property of matter that experiences electromagnetic force. Measured in Coulombs, it is carried largely by electrons and protons."
      },
      {
            "title": "Current",
            "concept": "First Principle",
            "desc": "The macroscopic flow of electric charge over time. Think of it as the volume of water flowing through a river per second."
      },
      {
            "title": "Voltage",
            "concept": "First Principle",
            "desc": "Electric potential difference. The \"pressure\" or push that drives charge carriers through a circuit, measured in Joules per Coulomb."
      },
      {
            "title": "Resistance",
            "concept": "First Principle",
            "desc": "The opposition to current flow. It converts electrical energy into heat as electrons collide within the material's atomic lattice."
      },
      {
            "title": "Ohm's Law",
            "concept": "First Principle",
            "desc": "V = IR. The foundational relationship stating that voltage is directly proportional to current, scaled by the resistance."
      },
      {
            "title": "Kirchhoff's Current Law",
            "concept": "First Principle",
            "desc": "Conservation of charge. At any electrical node, the sum of all currents entering must perfectly equal the sum of all currents leaving."
      },
      {
            "title": "Kirchhoff's Voltage Law",
            "concept": "First Principle",
            "desc": "Conservation of energy. The sum of all voltage drops and gains around any closed loop in a circuit must exactly equal zero."
      },
      {
            "title": "Power",
            "concept": "First Principle",
            "desc": "The rate of energy transfer (P = VI). It tells us how much work a circuit element is performing or how much heat it is dissipating."
      },
      {
            "title": "Series Circuit",
            "concept": "First Principle",
            "desc": "Components connected end-to-end. They share the exact same current, but the total voltage is divided among them."
      },
      {
            "title": "Parallel Circuit",
            "concept": "First Principle",
            "desc": "Components connected across the same two nodes. They share the exact same voltage, but the total current splits among the branches."
      },
      {
            "title": "Capacitance",
            "concept": "First Principle",
            "desc": "The ability to store energy in an electric field. Capacitors resist sudden changes in voltage, acting like a reservoir."
      },
      {
            "title": "Inductance",
            "concept": "First Principle",
            "desc": "The ability to store energy in a magnetic field. Inductors actively resist any sudden change in current flow by generating a counter-voltage."
      },
      {
            "title": "Impedance",
            "concept": "First Principle",
            "desc": "The AC equivalent of resistance. It combines standard resistance with frequency-dependent reactance from capacitors and inductors."
      },
      {
            "title": "Time Constant",
            "concept": "First Principle",
            "desc": "The metric (RC or L/R) dictating how fast a circuit responds to sudden changes, representing the time to reach ~63% of its final state."
      },
      {
            "title": "Superposition Theorem",
            "concept": "First Principle",
            "desc": "In a linear circuit with multiple sources, the total response is the exact sum of the responses caused by each source acting completely alone."
      },
      {
            "title": "Thevenin's Theorem",
            "concept": "First Principle",
            "desc": "Any complex linear circuit can be magically reduced to a single equivalent voltage source in series with a single equivalent resistor."
      },
      {
            "title": "Norton's Theorem",
            "concept": "First Principle",
            "desc": "Any complex linear circuit can be reduced to a single equivalent current source in parallel with a single equivalent resistor."
      },
      {
            "title": "Op-Amp (Ideal)",
            "concept": "First Principle",
            "desc": "An amplifier assumed to have infinite input resistance, zero output resistance, and infinite gain, allowing us to build perfect mathematical circuits."
      },
      {
            "title": "Diode",
            "concept": "First Principle",
            "desc": "A semiconductor one-way valve. It easily allows current to flow in one specific direction while heavily blocking it in the reverse."
      },
      {
            "title": "Transistor",
            "concept": "First Principle",
            "desc": "A semiconductor switch or amplifier. A tiny current or voltage at the control terminal strictly dictates a much larger current flowing through the device."
      }
],
    label: 'Circuit Theory',
    color: '#fdf2bc',
    topics: [
      { id: 'ohm', label: "Ohm's Law", desc: 'V = IR interactive circuit explorer', difficulty: 'Beginner',     icon: 'bolt', implemented: true },
      { id: 'kirchhoff', label: "Kirchhoff's Laws", desc: 'Live nodal analysis and circuit solver', difficulty: 'Intermediate', icon: 'circuit', implemented: true },
      { id: 'rc',  label: 'RC Circuit', desc: 'Capacitor charging time constant',   difficulty: 'Intermediate', icon: 'battery', implemented: false },
      { id: 'motor', label: 'DC Motor Studio', desc: 'Back EMF, Commutation, Thermal & Generator Mode', difficulty: 'Advanced', icon: 'gauge', implemented: true },
    ],
  },
  math: {
    cards: [
      {
            "title": "Functions",
            "concept": "First Principle",
            "desc": "A strict mathematical machine. It takes a single input and unambiguously maps it to exactly one output."
      },
      {
            "title": "Limits",
            "concept": "First Principle",
            "desc": "The foundation of calculus. It asks what value a function approaches as the input gets infinitely close to a specific point, without necessarily reaching it."
      },
      {
            "title": "Derivative",
            "concept": "First Principle",
            "desc": "The instantaneous rate of change. Graphically, it is the exact slope of the tangent line to a curve at a single, frozen point."
      },
      {
            "title": "Integral",
            "concept": "First Principle",
            "desc": "The continuous sum. It aggregates infinitely many infinitesimally small slices to find the total area under a curve."
      },
      {
            "title": "Fundamental Theorem of Calculus",
            "concept": "First Principle",
            "desc": "The profound revelation that differentiation and integration are exact, inverse operations of each other."
      },
      {
            "title": "Vectors",
            "concept": "First Principle",
            "desc": "A mathematical entity possessing both magnitude and direction, independent of any specific coordinate system."
      },
      {
            "title": "Dot Product",
            "concept": "First Principle",
            "desc": "A scalar measure of how much two vectors align. It projects one vector onto another, yielding zero if they are perfectly perpendicular."
      },
      {
            "title": "Cross Product",
            "concept": "First Principle",
            "desc": "A vector operation that creates a new vector perfectly perpendicular to the plane formed by the two original vectors."
      },
      {
            "title": "Matrices",
            "concept": "First Principle",
            "desc": "A grid of numbers representing a linear transformation. Multiplying by a matrix stretches, rotates, or shears space itself."
      },
      {
            "title": "Determinant",
            "concept": "First Principle",
            "desc": "A single number describing how much a matrix transformation scales areas or volumes. If it is zero, the transformation flattens space entirely."
      },
      {
            "title": "Eigenvalues & Eigenvectors",
            "concept": "First Principle",
            "desc": "Special vectors that, when transformed by a matrix, only stretch or shrink but never change their original direction."
      },
      {
            "title": "Complex Numbers",
            "concept": "First Principle",
            "desc": "Numbers containing a real and an \"imaginary\" part. They gracefully handle rotation and oscillation in a two-dimensional mathematical plane."
      },
      {
            "title": "Euler's Formula",
            "concept": "First Principle",
            "desc": "The profound equation elegantly linking exponential growth with sinusoidal oscillation across the complex plane."
      },
      {
            "title": "Differential Equations",
            "concept": "First Principle",
            "desc": "Equations that relate a changing quantity to its own rate of change, modeling almost every physical law in the universe."
      },
      {
            "title": "Taylor Series",
            "concept": "First Principle",
            "desc": "Approximating any smooth, complex function as an infinite polynomial based entirely on its derivatives at a single point."
      },
      {
            "title": "Fourier Transform",
            "concept": "First Principle",
            "desc": "Deconstructing any complex waveform into a sum of simple, pure sine and cosine waves of varying frequencies."
      },
      {
            "title": "Probability Density",
            "concept": "First Principle",
            "desc": "A function describing the likelihood of a continuous random variable falling within a specific range, where the total area equals 100%."
      },
      {
            "title": "Normal Distribution",
            "concept": "First Principle",
            "desc": "The bell curve. A universal statistical distribution where values cluster symmetrically around the mean due to the Central Limit Theorem."
      },
      {
            "title": "Boolean Algebra",
            "concept": "First Principle",
            "desc": "The mathematics of true and false. Using AND, OR, and NOT gates to logically process binary information."
      },
      {
            "title": "Graph Theory",
            "concept": "First Principle",
            "desc": "The study of nodes connected by edges. It abstracts routing, networks, and relationships into purely topological problems."
      }
],
    label: 'Mathematics',
    color: '#dfccf1',
    topics: [
      { id: 'vectors',     label: 'Vector Addition',   desc: 'Type vector formulas and watch the resultant update live', difficulty: 'Beginner',     icon: 'vector',  implemented: true },
      { id: 'derivatives', label: 'Derivatives',       desc: 'Slopes and rates of change',       difficulty: 'Intermediate', icon: 'activity',  implemented: false },
    ],
  },
  cs: {
    cards: [
      {
            "title": "Abstraction",
            "concept": "First Principle",
            "desc": "Hiding complex implementation details behind a simple interface. It allows engineers to build massive systems without holding every detail in mind."
      },
      {
            "title": "Algorithms",
            "concept": "First Principle",
            "desc": "A finite, unambiguous sequence of steps designed to solve a specific problem or perform a computation."
      },
      {
            "title": "Big O Notation",
            "concept": "First Principle",
            "desc": "The measure of scalability. It describes the worst-case scenario of how runtime or memory usage grows as the input size approaches infinity."
      },
      {
            "title": "Data Structures",
            "concept": "First Principle",
            "desc": "Specialized formats for organizing, processing, retrieving and storing data. Picking the right one defines the efficiency of the algorithm."
      },
      {
            "title": "Arrays",
            "concept": "First Principle",
            "desc": "A contiguous block of memory storing elements of the same type. Accessing an element by index takes instant O(1) time."
      },
      {
            "title": "Linked Lists",
            "concept": "First Principle",
            "desc": "Elements stored dynamically in memory, connected by pointers. Inserting an element is fast, but finding an element requires sequential searching."
      },
      {
            "title": "Stacks",
            "concept": "First Principle",
            "desc": "Last-In, First-Out (LIFO). A data structure where you can only add or remove from the very top, like a stack of heavy plates."
      },
      {
            "title": "Queues",
            "concept": "First Principle",
            "desc": "First-In, First-Out (FIFO). A structure handling elements in the exact order they arrived, like a line at a grocery store."
      },
      {
            "title": "Hash Tables",
            "concept": "First Principle",
            "desc": "Using a mathematical function to map keys to indices. It achieves near-instant O(1) lookups by jumping directly to the data."
      },
      {
            "title": "Trees",
            "concept": "First Principle",
            "desc": "A hierarchical graph with a root node branching out to children. Essential for fast searching, sorting, and hierarchical data representation."
      },
      {
            "title": "Recursion",
            "concept": "First Principle",
            "desc": "A function that calls itself until it reaches a base case. It solves large problems by breaking them down into identical, smaller sub-problems."
      },
      {
            "title": "Sorting",
            "concept": "First Principle",
            "desc": "Organizing chaotic data into an ordered sequence. Efficient algorithms (like Merge or Quick Sort) achieve this in O(n log n) time."
      },
      {
            "title": "Pointers",
            "concept": "First Principle",
            "desc": "Variables that store exact memory addresses rather than actual data. They grant raw power over memory management but introduce severe risk."
      },
      {
            "title": "Virtual Memory",
            "concept": "First Principle",
            "desc": "The OS tricking programs into thinking they have massive, contiguous RAM, while invisibly paging chunks of data back and forth to the hard drive."
      },
      {
            "title": "Concurrency",
            "concept": "First Principle",
            "desc": "The illusion of simultaneous execution. The OS rapidly switches the CPU between multiple tasks so they appear to run at the exact same time."
      },
      {
            "title": "Deadlock",
            "concept": "First Principle",
            "desc": "A fatal stalemate where two or more processes each hold a resource the other desperately needs, causing the entire system to freeze permanently."
      },
      {
            "title": "Object-Oriented Programming",
            "concept": "First Principle",
            "desc": "Bundling data (state) and the functions that operate on it (behavior) into single conceptual units called objects."
      },
      {
            "title": "Compilation",
            "concept": "First Principle",
            "desc": "Translating human-readable source code into raw, machine-executable binary instructions all at once before execution."
      },
      {
            "title": "Caching",
            "concept": "First Principle",
            "desc": "Storing a tiny, fast-access copy of frequently used data near the CPU to avoid the massive latency of fetching it from main RAM."
      },
      {
            "title": "Cryptography",
            "concept": "First Principle",
            "desc": "Using pure mathematics to encrypt data. Modern security relies on the fact that multiplying huge primes is easy, but factoring them is practically impossible."
      }
],
    label: 'Computer Science',
    color: '#e85d2a',
    topics: [
      { id: 'nand_flash',  label: 'NAND Flash Memory', desc: 'Simulate pages, blocks, erases, and wear leveling', difficulty: 'Intermediate', icon: 'memory', implemented: true },
      { id: 'cpu_scheduler', label: 'CPU Scheduler', desc: 'Preemptive & Non-Preemptive Simulator', difficulty: 'Advanced', icon: 'cpu', implemented: true },
      { id: 'sorting',      label: 'Sorting Algorithms', desc: 'Visualize bubble, merge, quicksort', difficulty: 'Beginner',     icon: 'barChart', implemented: false },
      { id: 'pathfinding',  label: 'Pathfinding',        desc: 'BFS and Dijkstra on graphs',         difficulty: 'Intermediate', icon: 'network', implemented: false },
    ],
  },
  law: {
    cards: [
      {
            "title": "Stare Decisis",
            "concept": "First Principle",
            "desc": "Let the decision stand. The legal principle of determining points in litigation according to strict historical precedent."
      },
      {
            "title": "Mens Rea",
            "concept": "First Principle",
            "desc": "The guilty mind. In criminal law, it is the intention or knowledge of wrongdoing that constitutes part of a crime, distinguishing accident from malice."
      },
      {
            "title": "Actus Reus",
            "concept": "First Principle",
            "desc": "The guilty act. The physical action or conduct that is an essential element of a crime, paired necessarily with mens rea."
      },
      {
            "title": "Habeas Corpus",
            "concept": "First Principle",
            "desc": "Produce the body. A fundamental writ demanding that a prisoner be brought before a court to determine if their detention is completely lawful."
      },
      {
            "title": "Due Process",
            "concept": "First Principle",
            "desc": "The absolute constitutional guarantee that the state must respect all legal rights owed to a person, ensuring fair procedures and trials."
      },
      {
            "title": "Burden of Proof",
            "concept": "First Principle",
            "desc": "The obligation to prove one's assertion. In criminal trials, the state must prove guilt \"beyond a reasonable doubt.\""
      },
      {
            "title": "Tort",
            "concept": "First Principle",
            "desc": "A civil wrong (other than breach of contract) that causes a claimant to suffer loss or harm, resulting in legal liability for the person who committed the act."
      },
      {
            "title": "Negligence",
            "concept": "First Principle",
            "desc": "Failure to exercise the care that a reasonably prudent person would exercise in like circumstances, resulting in unintentional harm."
      },
      {
            "title": "Strict Liability",
            "concept": "First Principle",
            "desc": "Legal responsibility for damages or injury, even if the person found strictly liable was not at fault or negligent (e.g., keeping wild animals)."
      },
      {
            "title": "Offer and Acceptance",
            "concept": "First Principle",
            "desc": "The fundamental matching of minds. A clear proposal by one party and an absolute, unqualified agreement by the other to form a contract."
      },
      {
            "title": "Consideration",
            "concept": "First Principle",
            "desc": "The bargained-for exchange. A contract is only valid if something of value (money, goods, or a promise) is exchanged between the parties."
      },
      {
            "title": "Breach of Contract",
            "concept": "First Principle",
            "desc": "The failure of a party to perform any of their obligations as strictly outlined in a legally binding agreement."
      },
      {
            "title": "Fiduciary Duty",
            "concept": "First Principle",
            "desc": "The highest standard of care in law. An absolute obligation to act solely in the best interest of another party, completely ignoring personal gain."
      },
      {
            "title": "Jurisdiction",
            "concept": "First Principle",
            "desc": "The practical authority granted to a legal body to administer justice within a defined area of responsibility or geographical region."
      },
      {
            "title": "Subpoena",
            "concept": "First Principle",
            "desc": "A formal writ ordering a person to attend a court under strict penalty for failure to comply."
      },
      {
            "title": "Double Jeopardy",
            "concept": "First Principle",
            "desc": "A procedural defense that absolutely prevents an accused person from being tried again on the same (or similar) charges following a valid acquittal or conviction."
      },
      {
            "title": "Hearsay",
            "concept": "First Principle",
            "desc": "An out-of-court statement offered to prove the truth of the matter asserted. It is generally inadmissible because the speaker cannot be cross-examined."
      },
      {
            "title": "Eminent Domain",
            "concept": "First Principle",
            "desc": "The power of the state to legally seize private property for public use, provided the owner receives just and fair compensation."
      },
      {
            "title": "Statute of Limitations",
            "concept": "First Principle",
            "desc": "A strict legal time limit specifying how long after an event formal legal proceedings may be initiated."
      },
      {
            "title": "Amicus Curiae",
            "concept": "First Principle",
            "desc": "Friend of the court. An impartial brief filed by someone who is not a party to a case but holds strong interest or expertise in the subject matter."
      }
],
    label: 'Law',
    color: '#faf5ee',
    topics: [
      { id: 'case',     label: 'Case Study Simulator', desc: 'Argue landmark legal cases', difficulty: 'Advanced',     icon: 'gavel', implemented: true },
      { id: 'courtroom', label: 'Virtual Courtroom', desc: 'Step into the courtroom and present your case', difficulty: 'Advanced', icon: 'landmark', implemented: true },
      { id: 'contract', label: 'Contract Law',         desc: 'Draft and review contracts', difficulty: 'Intermediate', icon: 'briefcase', implemented: false },
    ],
  },
  med: {
    cards: [
      {
            "title": "Homeostasis",
            "concept": "First Principle",
            "desc": "The active, ceaseless regulation of the body's internal environment to maintain a stable, constant state despite external fluctuations."
      },
      {
            "title": "Cell Theory",
            "concept": "First Principle",
            "desc": "The biological principle that all living organisms are made of cells, and all cells arise exclusively from pre-existing cells."
      },
      {
            "title": "Action Potential",
            "concept": "First Principle",
            "desc": "The rapid, all-or-nothing electrical pulse traveling down a neuron's axon, driven by the sudden opening and closing of voltage-gated ion channels."
      },
      {
            "title": "Synaptic Transmission",
            "concept": "First Principle",
            "desc": "The chemical leap. Neurotransmitters bridge the gap between neurons, converting an electrical signal into a chemical one and back again."
      },
      {
            "title": "Central Dogma",
            "concept": "First Principle",
            "desc": "The directional flow of genetic information: DNA is transcribed into RNA, which is then translated into functional proteins."
      },
      {
            "title": "Enzymes",
            "concept": "First Principle",
            "desc": "Biological catalysts. They vastly accelerate the rate of necessary chemical reactions without being consumed in the process."
      },
      {
            "title": "ATP (Adenosine Triphosphate)",
            "concept": "First Principle",
            "desc": "The universal energy currency of the cell. Breaking its high-energy phosphate bonds powers nearly all cellular work."
      },
      {
            "title": "Osmosis",
            "concept": "First Principle",
            "desc": "The passive diffusion of water across a semi-permeable membrane, moving toward the region of higher solute concentration."
      },
      {
            "title": "Metabolism",
            "concept": "First Principle",
            "desc": "The sum total of all chemical reactions in the body. It consists of breaking down molecules for energy (catabolism) and building new ones (anabolism)."
      },
      {
            "title": "Immune Response",
            "concept": "First Principle",
            "desc": "The complex systemic defense mechanism distinguishing self from non-self, utilizing white blood cells to actively seek and destroy foreign pathogens."
      },
      {
            "title": "Inflammation",
            "concept": "First Principle",
            "desc": "The body's localized alarm system. Increased blood flow brings immune cells to an area of injury or infection, causing heat, redness, and swelling."
      },
      {
            "title": "Antibodies",
            "concept": "First Principle",
            "desc": "Highly specific Y-shaped proteins produced by B-cells that precisely tag and neutralize specific foreign antigens."
      },
      {
            "title": "Pharmacokinetics",
            "concept": "First Principle",
            "desc": "What the body does to the drug. The study of how a medication is Absorbed, Distributed, Metabolized, and Excreted (ADME)."
      },
      {
            "title": "Pharmacodynamics",
            "concept": "First Principle",
            "desc": "What the drug does to the body. The study of how molecules bind to biological receptors to alter cellular signaling and function."
      },
      {
            "title": "Cardiac Cycle",
            "concept": "First Principle",
            "desc": "The rhythmic sequence of muscle contraction (systole) and relaxation (diastole) that efficiently pumps blood throughout the circulatory system."
      },
      {
            "title": "Gas Exchange",
            "concept": "First Principle",
            "desc": "The passive diffusion of oxygen into the blood and carbon dioxide out, occurring across the microscopic, thin walls of the alveoli in the lungs."
      },
      {
            "title": "Endocrine System",
            "concept": "First Principle",
            "desc": "The slow, systemic communication network. Glands secrete hormones directly into the bloodstream to heavily regulate distant target organs."
      },
      {
            "title": "Renal Filtration",
            "concept": "First Principle",
            "desc": "The kidneys' rigorous sorting process. Blood is filtered under pressure, waste is excreted as urine, and vital water and ions are reabsorbed."
      },
      {
            "title": "Apoptosis",
            "concept": "First Principle",
            "desc": "Programmed cell death. A highly regulated suicide mechanism essential for clearing away damaged, unneeded, or dangerous cells."
      },
      {
            "title": "Pathology",
            "concept": "First Principle",
            "desc": "The study of suffering. Understanding how diseases fundamentally alter normal cellular structure and systemic function."
      }
],
    label: 'Medicine',
    color: '#e85d2a',
    topics: [
      { id: 'anatomy',       label: 'Human Anatomy',  desc: 'Interactive body systems', difficulty: 'Intermediate', icon: 'heartPulse', implemented: false },
      { id: 'pharmacology',  label: 'Pharmacology',   desc: 'Drug interaction simulator', difficulty: 'Advanced',    icon: 'pill', implemented: false },
    ],
  },
}

export const DIFFICULTY_COLOR = {
  Beginner:     { bg: 'rgba(42,157,110,0.12)',  text: '#1a7a52' },
  Intermediate: { bg: 'rgba(232,166,48,0.12)', text: '#9a6e00' },
  Advanced:     { bg: 'rgba(217,64,64,0.12)',  text: '#b02020' },
}
