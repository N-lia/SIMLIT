import { htmlToElement } from '../../../utils/dom.js'
import { renderKaTeXString } from '../../KaTeX.jsx'
import { timeConstant, capacitorVoltage, circuitCurrent, fractionAfter, storedEnergy } from './rcModel.js'
import '../../Simulation.css'

const W = 760, H = 470
const PLOT = { left: 70, right: 700, top: 240, bottom: 430 }
const TAU_WINDOW = 5          // the plot spans 5 time constants
const SECONDS_PER_TAU = 1.2   // wall-clock seconds per time constant during playback

// Circuit geometry
const C_LEFT = 90, C_RIGHT = 580, C_TOP = 50, C_BOT = 185
const PIVOT = { x: 260, y: C_TOP }
const CONTACT_A = { x: 200, y: C_TOP }         // to the battery: charge
const CONTACT_B = { x: 225, y: C_TOP + 45 }    // bypass to ground: discharge
const RES = { x0: 330, x1: 470 }

function formatTime(s) {
  if (s >= 1) return `${s.toFixed(2)} s`
  if (s >= 1e-3) return `${(s * 1e3).toFixed(1)} ms`
  return `${(s * 1e6).toFixed(0)} µs`
}

function drawCircuit(ctx, s) {
  const { mode, vc, V, current, phase, R, C } = s
  ctx.lineCap = 'round'

  // Wires
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(C_LEFT, C_BOT); ctx.lineTo(C_LEFT, C_TOP); ctx.lineTo(CONTACT_A.x, C_TOP)    // battery to contact A
  ctx.moveTo(PIVOT.x, C_TOP); ctx.lineTo(RES.x0, C_TOP)                                    // pivot to resistor
  ctx.moveTo(RES.x1, C_TOP); ctx.lineTo(C_RIGHT, C_TOP); ctx.lineTo(C_RIGHT, 100)          // resistor to cap top
  ctx.moveTo(C_RIGHT, 132); ctx.lineTo(C_RIGHT, C_BOT); ctx.lineTo(C_LEFT, C_BOT)          // cap bottom to ground
  ctx.moveTo(CONTACT_B.x, CONTACT_B.y); ctx.lineTo(CONTACT_B.x, C_BOT)                     // discharge bypass
  ctx.stroke()

  // Battery (on the left wire)
  const by = (C_TOP + C_BOT) / 2
  ctx.fillStyle = '#fff4df'
  ctx.fillRect(C_LEFT - 20, by - 18, 40, 36)
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(C_LEFT - 18, by - 8); ctx.lineTo(C_LEFT + 18, by - 8); ctx.stroke()
  ctx.lineWidth = 5
  ctx.beginPath(); ctx.moveTo(C_LEFT - 9, by + 6); ctx.lineTo(C_LEFT + 9, by + 6); ctx.stroke()
  ctx.font = "bold 12px 'IBM Plex Mono', monospace"
  ctx.fillStyle = '#25231f'
  ctx.textAlign = 'right'
  ctx.fillText(`${V} V`, C_LEFT - 26, by + 4)
  ctx.fillText('+', C_LEFT - 22, by - 12)

  // Switch
  ctx.fillStyle = '#25231f'
  for (const p of [PIVOT, CONTACT_A, CONTACT_B]) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill() }
  const target = mode === 'charge' ? CONTACT_A : CONTACT_B
  ctx.strokeStyle = '#a9402f'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(PIVOT.x, PIVOT.y); ctx.lineTo(target.x + (target === CONTACT_A ? 4 : 2), target.y + (target === CONTACT_A ? -6 : -3)); ctx.stroke()
  ctx.font = "11px 'IBM Plex Mono', monospace"
  ctx.textAlign = 'center'
  ctx.fillText('charge', CONTACT_A.x - 8, C_TOP - 12)
  ctx.fillText('discharge', CONTACT_B.x - 50, CONTACT_B.y + 4)

  // Resistor zigzag
  ctx.strokeStyle = '#2f5d88'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(RES.x0, C_TOP)
  const n = 8, seg = (RES.x1 - RES.x0) / n
  for (let i = 0; i < n; i++) ctx.lineTo(RES.x0 + seg * (i + 0.5), C_TOP + (i % 2 ? 10 : -10))
  ctx.lineTo(RES.x1, C_TOP)
  ctx.stroke()
  ctx.fillStyle = '#2f5d88'
  ctx.fillText(`R = ${(R / 1000).toFixed(0)} kΩ`, (RES.x0 + RES.x1) / 2, C_TOP - 16)

  // Capacitor plates with charge marks
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(C_RIGHT - 30, 100); ctx.lineTo(C_RIGHT + 30, 100); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(C_RIGHT - 30, 132); ctx.lineTo(C_RIGHT + 30, 132); ctx.stroke()
  const marks = Math.round((vc / 12) * 10)
  ctx.font = "bold 11px 'IBM Plex Mono', monospace"
  for (let i = 0; i < marks; i++) {
    const x = C_RIGHT - 27 + i * 6
    ctx.fillStyle = '#a9402f'; ctx.fillText('+', x, 94)
    ctx.fillStyle = '#2f5d88'; ctx.fillText('−', x, 146)
  }
  ctx.textAlign = 'left'
  ctx.fillStyle = '#25231f'
  ctx.font = "12px 'IBM Plex Mono', monospace"
  ctx.fillText(`C = ${(C * 1e6).toFixed(0)} µF`, C_RIGHT + 38, 112)
  ctx.fillText(`V_C = ${vc.toFixed(2)} V`, C_RIGHT + 38, 128)

  // Moving charge carriers along the active loop (speed ∝ |I|)
  const path = mode === 'charge'
    ? [[C_LEFT, C_BOT], [C_LEFT, C_TOP], [C_RIGHT, C_TOP], [C_RIGHT, C_BOT], [C_LEFT, C_BOT]]
    : [[CONTACT_B.x, C_BOT], [CONTACT_B.x, C_TOP], [C_RIGHT, C_TOP], [C_RIGHT, C_BOT], [CONTACT_B.x, C_BOT]]
  // Discharge current flows the other way round the loop.
  const pts = mode === 'charge' ? path : [...path].reverse()
  const lens = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])
    lens.push(l); total += l
  }
  const strength = Math.min(1, Math.abs(current) / (V / R || 1))
  if (strength > 0.01) {
    ctx.fillStyle = `rgba(76,122,60,${0.25 + 0.75 * strength})`
    const count = 16
    for (let k = 0; k < count; k++) {
      let d = ((phase + (k * total) / count) % total + total) % total
      let i = 0
      while (d > lens[i]) { d -= lens[i]; i++ }
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
      const t = d / lens[i]
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t
      // Skip the gap between capacitor plates
      if (x === C_RIGHT && y > 100 && y < 132) continue
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill()
    }
  }
}

function drawPlot(ctx, s) {
  const { tau, history, R, segment } = s
  const pw = PLOT.right - PLOT.left
  const ph = PLOT.bottom - PLOT.top
  const tMax = TAU_WINDOW * tau
  const xOf = (t) => PLOT.left + (t / tMax) * pw
  const yV = (v) => PLOT.bottom - (v / 12) * ph
  const iMax = 12 / R
  const yI = (i) => PLOT.bottom - (Math.abs(i) / iMax) * ph

  ctx.fillStyle = 'rgba(234,214,167,0.25)'
  ctx.fillRect(PLOT.left, PLOT.top, pw, ph)

  // τ gridlines with the textbook percentages
  ctx.font = "10px 'IBM Plex Mono', monospace"
  ctx.textAlign = 'center'
  for (let n = 1; n <= TAU_WINDOW; n++) {
    const x = xOf(n * tau)
    ctx.strokeStyle = 'rgba(37,35,31,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, PLOT.top); ctx.lineTo(x, PLOT.bottom); ctx.stroke()
    ctx.fillStyle = 'rgba(37,35,31,0.7)'
    ctx.fillText(`${n}τ`, x, PLOT.bottom + 14)
    ctx.fillText(`${(fractionAfter(n) * 100).toFixed(1)}%`, x, PLOT.top - 6)
  }

  // Axes
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(PLOT.left, PLOT.top); ctx.lineTo(PLOT.left, PLOT.bottom); ctx.lineTo(PLOT.right, PLOT.bottom); ctx.stroke()
  ctx.fillStyle = '#2f5d88'
  ctx.textAlign = 'right'
  for (let v = 0; v <= 12; v += 4) ctx.fillText(`${v} V`, PLOT.left - 6, yV(v) + 3)
  ctx.textAlign = 'left'
  ctx.fillText('V_C', PLOT.left + 6, PLOT.top + 12)
  ctx.fillStyle = '#a9402f'
  ctx.fillText('|I|', PLOT.left + 46, PLOT.top + 12)
  ctx.fillStyle = 'rgba(37,35,31,0.7)'
  ctx.textAlign = 'right'
  ctx.fillText(`t (5τ = ${formatTime(tMax)})`, PLOT.right, PLOT.bottom + 28)

  // Theoretical curve for the current segment, dashed
  ctx.setLineDash([5, 5])
  ctx.strokeStyle = 'rgba(47,93,136,0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let k = 0; k <= 100; k++) {
    const t = (k / 100) * tMax
    const v = capacitorVoltage(t, { v0: segment.v0, vTarget: segment.vTarget, tau })
    if (k === 0) ctx.moveTo(xOf(t), yV(v)); else ctx.lineTo(xOf(t), yV(v))
  }
  ctx.stroke()
  // Target level
  ctx.strokeStyle = 'rgba(37,35,31,0.3)'
  ctx.beginPath(); ctx.moveTo(PLOT.left, yV(segment.vTarget)); ctx.lineTo(PLOT.right, yV(segment.vTarget)); ctx.stroke()
  ctx.setLineDash([])

  // Recorded traces
  const trace = (key, y, color) => {
    if (history.length < 2) return
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    history.forEach((p, i) => {
      if (i === 0) ctx.moveTo(xOf(p.t), y(p[key])); else ctx.lineTo(xOf(p.t), y(p[key]))
    })
    ctx.stroke()
  }
  trace('i', yI, '#a9402f')
  trace('v', yV, '#2f5d88')
}

export function mountRcCircuitSimulation(container) {
  const ktex = (math, display = false) => renderKaTeXString(math, display)
  const root = htmlToElement(`
    <div class="sim-inner focused-sim rc-sim">
      <div class="focused-header">
        <div>
          <span class="focused-logo">RC Circuit</span>
          <span class="focused-subtitle">capacitor charging · discharging · time constant τ = RC</span>
        </div>
        <div class="focused-badge">${ktex('V_C(t)=V_s\\left(1-e^{-t/RC}\\right)')}</div>
      </div>
      <div class="focused-grid">
        <div class="focused-canvas-panel">
          <canvas class="sim-canvas" width="${W}" height="${H}"></canvas>
          <div class="panel-tag">SCOPE — <span data-tag>CHARGING</span> · <span data-speed></span></div>
        </div>
        <div class="focused-right-col">
          <div class="focused-panel">
            <div class="section-title">Components</div>
            <div class="control-row">
              <label>Source voltage <span class="ctrl-val" data-v-label></span></label>
              <input type="range" min="1" max="12" step="0.5" value="9" data-v-range />
            </div>
            <div class="control-row">
              <label>Resistance <span class="ctrl-val" data-r-label></span></label>
              <input type="range" min="1" max="100" step="1" value="10" data-r-range />
            </div>
            <div class="control-row">
              <label>Capacitance <span class="ctrl-val" data-c-label></span></label>
              <input type="range" min="10" max="1000" step="10" value="100" data-c-range />
            </div>
            <div class="mode-grid">
              <button type="button" class="on" data-charge>Charge</button>
              <button type="button" data-discharge>Discharge</button>
              <button type="button" class="full" data-reset>Empty the capacitor</button>
            </div>
          </div>
          <div class="focused-readout-grid two">
            <div class="readout"><div class="readout-label">Time constant ${ktex('\\tau')}</div><div class="readout-val amber" data-tau></div></div>
            <div class="readout"><div class="readout-label">Elapsed</div><div class="readout-val" data-t></div></div>
            <div class="readout"><div class="readout-label">${ktex('V_C')}</div><div class="readout-val cyan" data-vc></div></div>
            <div class="readout"><div class="readout-label">Current ${ktex('I')}</div><div class="readout-val red" data-i></div></div>
            <div class="readout"><div class="readout-label">Charge ${ktex('Q=CV_C')}</div><div class="readout-val green" data-q></div></div>
            <div class="readout"><div class="readout-label">Energy ${ktex('\\tfrac12CV_C^2')}</div><div class="readout-val" data-e></div></div>
            <div class="readout wide"><div class="readout-label">Progress</div><div class="readout-note" data-note></div></div>
          </div>
        </div>
      </div>
    </div>
  `)

  const canvas = root.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const q = (sel) => root.querySelector(sel)
  const vRange = q('[data-v-range]')
  const rRange = q('[data-r-range]')
  const cRange = q('[data-c-range]')
  const chargeBtn = q('[data-charge]')
  const dischargeBtn = q('[data-discharge]')
  const resetBtn = q('[data-reset]')
  const out = {
    v: q('[data-v-label]'), r: q('[data-r-label]'), c: q('[data-c-label]'),
    tau: q('[data-tau]'), t: q('[data-t]'), vc: q('[data-vc]'), i: q('[data-i]'),
    q: q('[data-q]'), e: q('[data-e]'), note: q('[data-note]'),
    tag: q('[data-tag]'), speed: q('[data-speed]'),
  }

  let V = 9
  let R = 10e3
  let C = 100e-6
  let mode = 'charge'
  let vc = 0
  let segment = { v0: 0, vTarget: V, t: 0 }
  let history = []
  let phase = 0
  let rafId = null
  let last = null

  const tau = () => timeConstant(R, C)

  function startSegment() {
    segment = { v0: vc, vTarget: mode === 'charge' ? V : 0, t: 0 }
    history = [{ t: 0, v: vc, i: circuitCurrent(vc, { vTarget: segment.vTarget, R }) }]
  }

  function updateReadouts(current) {
    const T = tau()
    out.v.textContent = `${V} V`
    out.r.textContent = `${(R / 1000).toFixed(0)} kΩ`
    out.c.textContent = `${(C * 1e6).toFixed(0)} µF`
    out.tau.textContent = formatTime(T)
    out.t.textContent = `${formatTime(segment.t)} (${(segment.t / T).toFixed(2)}τ)`
    out.vc.textContent = `${vc.toFixed(2)} V`
    out.i.textContent = `${(current * 1000).toFixed(3)} mA`
    out.q.textContent = `${(C * vc * 1000).toFixed(3)} mC`
    out.e.textContent = `${(storedEnergy(C, vc) * 1000).toFixed(2)} mJ`
    const gap = segment.vTarget - segment.v0
    const done = Math.abs(gap) < 1e-6 ? 100 : ((vc - segment.v0) / gap) * 100
    out.note.textContent = Math.abs(gap) < 1e-6
      ? `Nothing to do: the capacitor is already at ${segment.vTarget.toFixed(2)} V.`
      : `${done.toFixed(1)}% of the way from ${segment.v0.toFixed(2)} V to ${segment.vTarget.toFixed(2)} V. After 1τ it's 63.2%, after 5τ it's 99.3%, which engineers call "fully" ${mode === 'charge' ? 'charged' : 'discharged'}.`
    out.tag.textContent = mode === 'charge' ? 'CHARGING' : 'DISCHARGING'
    const speed = 1 / (SECONDS_PER_TAU / T)
    out.speed.textContent = speed >= 1 ? `PLAYBACK ×${speed.toFixed(1)}` : `SLOW-MO ×${speed.toPrecision(2)}`
  }

  function render() {
    const current = circuitCurrent(vc, { vTarget: segment.vTarget, R })
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#fff4df'
    ctx.fillRect(0, 0, W, H)
    drawCircuit(ctx, { mode, vc, V, current, phase, R, C })
    drawPlot(ctx, { tau: tau(), history, R, segment })
    updateReadouts(current)
  }

  function tick(now) {
    if (last === null) last = now
    const realDt = Math.min(0.05, (now - last) / 1000)
    last = now
    const T = tau()
    const simDt = (realDt / SECONDS_PER_TAU) * T
    if (segment.t < TAU_WINDOW * T) {
      segment.t = Math.min(TAU_WINDOW * T, segment.t + simDt)
      vc = capacitorVoltage(segment.t, { v0: segment.v0, vTarget: segment.vTarget, tau: T })
      history.push({ t: segment.t, v: vc, i: circuitCurrent(vc, { vTarget: segment.vTarget, R }) })
    }
    const strength = Math.abs(circuitCurrent(vc, { vTarget: segment.vTarget, R })) / (V / R)
    phase += realDt * 160 * Math.min(1, strength)
    render()
    rafId = requestAnimationFrame(tick)
  }

  function setMode(next) {
    mode = next
    chargeBtn.classList.toggle('on', mode === 'charge')
    dischargeBtn.classList.toggle('on', mode === 'discharge')
    startSegment()
  }

  function onCharge() { setMode('charge') }
  function onDischarge() { setMode('discharge') }
  function onReset() { vc = 0; startSegment() }
  function onParams() {
    V = Number(vRange.value)
    R = Number(rRange.value) * 1e3
    C = Number(cRange.value) * 1e-6
    // Changing a component restarts the transient from the present voltage.
    startSegment()
  }

  chargeBtn.addEventListener('click', onCharge)
  dischargeBtn.addEventListener('click', onDischarge)
  resetBtn.addEventListener('click', onReset)
  const ranges = [vRange, rRange, cRange]
  ranges.forEach((r) => r.addEventListener('input', onParams))

  startSegment()
  render()
  rafId = requestAnimationFrame(tick)
  container.appendChild(root)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    chargeBtn.removeEventListener('click', onCharge)
    dischargeBtn.removeEventListener('click', onDischarge)
    resetBtn.removeEventListener('click', onReset)
    ranges.forEach((r) => r.removeEventListener('input', onParams))
    if (container.contains(root)) container.removeChild(root)
  }
}
