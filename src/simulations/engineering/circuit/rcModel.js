// Pure model for the RC charging / discharging simulation (no DOM).

/** Time constant in seconds. R in ohms, C in farads. */
export function timeConstant(R, C) {
  return R * C
}

/**
 * Capacitor voltage after time t (s) when the switch connects it to a source
 * `vTarget` (vTarget = 0 means discharging through R). `v0` is the voltage at
 * the moment the switch moved.
 */
export function capacitorVoltage(t, { v0, vTarget, tau }) {
  return vTarget + (v0 - vTarget) * Math.exp(-t / tau)
}

/** Current through R (A). Positive while charging, negative while discharging. */
export function circuitCurrent(vc, { vTarget, R }) {
  return (vTarget - vc) / R
}

/** Fraction of the remaining gap closed after n time constants (63.2%, 86.5%, ...). */
export function fractionAfter(nTau) {
  return 1 - Math.exp(-nTau)
}

export function storedEnergy(C, vc) {
  return 0.5 * C * vc * vc
}
