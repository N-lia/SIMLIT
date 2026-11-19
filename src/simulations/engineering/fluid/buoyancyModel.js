// Pure physics for the buoyancy simulation (no DOM), so it can be unit tested.

export const G = 9.81

export const FLUIDS = [
  { id: 'fresh', label: 'Fresh water', rho: 1000 },
  { id: 'sea', label: 'Seawater', rho: 1025 },
  { id: 'oil', label: 'Vegetable oil', rho: 920 },
  { id: 'glycerin', label: 'Glycerin', rho: 1260 },
  { id: 'mercury', label: 'Mercury', rho: 13546 },
]

export const MATERIALS = [
  { id: 'cork', label: 'Cork', rho: 240 },
  { id: 'pine', label: 'Pine', rho: 500 },
  { id: 'ice', label: 'Ice', rho: 917 },
  { id: 'pvc', label: 'PVC', rho: 1380 },
  { id: 'aluminium', label: 'Aluminium', rho: 2700 },
  { id: 'steel', label: 'Steel', rho: 7850 },
]

/** Depth of the cube that is under the surface, clamped to [0, side]. */
export function submergedDepth(bottomY, side, surfaceY) {
  return Math.min(side, Math.max(0, surfaceY - bottomY))
}

/**
 * Forces on a cube of side `side` (m) and density `rhoObj` whose bottom face
 * sits at `bottomY` (m above the tank floor) in a fluid of density `rhoFluid`
 * with its free surface at `surfaceY`.
 */
export function cubeForces({ side, rhoObj, rhoFluid, bottomY, surfaceY }) {
  const volume = side ** 3
  const mass = rhoObj * volume
  const depth = submergedDepth(bottomY, side, surfaceY)
  const displaced = side * side * depth
  const weight = mass * G
  const buoyant = rhoFluid * displaced * G
  return { volume, mass, depth, displaced, weight, buoyant, net: buoyant - weight }
}

/**
 * Where the cube comes to rest. A cube floats when rhoObj < rhoFluid, with
 * submerged fraction rhoObj / rhoFluid (Archimedes). Otherwise it sinks and
 * the floor supplies the missing support as a normal force.
 */
export function equilibrium({ side, rhoObj, rhoFluid, surfaceY }) {
  const volume = side ** 3
  const weight = rhoObj * volume * G
  if (rhoObj < rhoFluid) {
    const fraction = rhoObj / rhoFluid
    return { floats: true, fraction, normal: 0, bottomY: surfaceY - fraction * side }
  }
  const fraction = Math.min(1, surfaceY / side)
  const buoyant = rhoFluid * volume * fraction * G
  return { floats: false, fraction, normal: weight - buoyant, bottomY: 0 }
}

/**
 * One semi-implicit Euler step. Adds a linear drag that grows with the
 * submerged fraction so the bobbing settles instead of oscillating forever.
 */
export function stepCube(state, params, dt) {
  const f = cubeForces({ ...params, bottomY: state.y })
  const frac = f.depth / params.side
  const dragCoef = 0.4 + 3.2 * frac
  const acc = f.net / f.mass - dragCoef * state.v
  let v = state.v + acc * dt
  let y = state.y + v * dt
  if (y <= 0) {
    y = 0
    if (v < 0) v = 0
  }
  return { y, v }
}
