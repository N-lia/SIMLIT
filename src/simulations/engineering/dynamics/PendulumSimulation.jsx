import { htmlToElement } from '../../../utils/dom.js'
import { renderKaTeXString } from '../../KaTeX.jsx'
import '../../Simulation.css'

const W = 760, H = 420, G = 9.8

function drawPendulum(ctx, theta, L, trail) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#fff4df'
  ctx.fillRect(0, 0, W, H)

  const bg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 1.15)
  bg.addColorStop(0, 'rgba(47,93,136,0.12)')
  bg.addColorStop(1, 'rgba(255,244,223,0)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(37, 35, 31, 0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  const px = W / 2, py = 70
  const scale = (H - 110) / 3.2
  const bx = px + Math.sin(theta) * L * scale
  const by = py + Math.cos(theta) * L * scale

  // Ghost trail
  ctx.lineWidth = 2
  trail.forEach((t, i) => {
    const tx = px + Math.sin(t) * L * scale
    const ty = py + Math.cos(t) * L * scale
    ctx.strokeStyle = `rgba(47,93,136,${(i / trail.length) * 0.34})`
    if (i === 0) { ctx.beginPath(); ctx.moveTo(tx, ty) }
    else ctx.lineTo(tx, ty)
  })
  if (trail.length > 1) ctx.stroke()

  // Rod
  ctx.strokeStyle = 'rgba(37,35,31,0.5)'
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke()

  // Pivot
  ctx.fillStyle = '#25231f'
  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill()

  // Ceiling bracket
  ctx.strokeStyle = 'rgba(37,35,31,0.24)'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(px-24, py-4); ctx.lineTo(px+24, py-4); ctx.stroke()

  // Bob glow
  const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 20)
  grd.addColorStop(0, 'rgba(76,122,60,0.32)')
  grd.addColorStop(1, 'rgba(76,122,60,0)')
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(bx, by, 20, 0, Math.PI*2); ctx.fill()

  // Bob
  const bobGrad = ctx.createRadialGradient(bx-4, by-4, 1, bx, by, 14)
  bobGrad.addColorStop(0, '#6d914b')
  bobGrad.addColorStop(1, '#2f5d88')
  ctx.fillStyle = bobGrad; ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = 'rgba(255,244,223,0.55)'; ctx.beginPath(); ctx.arc(bx-4, by-4, 3, 0, Math.PI*2); ctx.fill()
}

export function mountPendulumSimulation(container) {
  const ktex = (math, display = false, className = '') => renderKaTeXString(math, display, className)
  const root = htmlToElement(`
    <div class="sim-inner focused-sim simple-pendulum-sim">
      <div class="focused-header">
        <div>
          <span class="focused-logo">Simple Pendulum</span>
          <span class="focused-subtitle">period model · damping · angular motion</span>
        </div>
        <div class="focused-badge">${ktex('T=2\\pi\\sqrt{L/g}')}</div>
      </div>
      <div class="focused-grid">
        <div class="focused-canvas-panel">
          <canvas class="sim-canvas" width="${W}" height="${H}"></canvas>
          <div class="panel-tag">SIMULATION — <span>SMALL ANGLE</span> MODEL</div>
          <div class="scanlines"></div>
        </div>
        <div class="focused-right-col">
          <div class="focused-panel">
            <div class="section-title">Parameters</div>
            <div class="control-row">
              <label>Length <span class="ctrl-val" data-length-label></span></label>
              <input type="range" min="0.5" max="3" step="0.1" value="1.5" data-length-range />
            </div>
            <div class="control-row">
              <label>Initial angle <span class="ctrl-val" data-angle-label></span></label>
              <input type="range" min="5" max="60" value="30" data-angle-range />
            </div>
            <div class="mode-grid">
              <button class="on full" type="button" data-start>Start</button>
              <button class="full" type="button" data-reset>Reset</button>
            </div>
          </div>
          <div class="focused-readout-grid">
            <div class="readout"><div class="readout-label">Period ${ktex('T')}</div><div class="readout-val amber" data-period></div></div>
            <div class="readout"><div class="readout-label">Length</div><div class="readout-val cyan" data-length></div></div>
            <div class="readout"><div class="readout-label">Angle ${ktex('\\theta_0')}</div><div class="readout-val green" data-angle></div></div>
          </div>
        </div>
      </div>
    </div>
  `)

  const canvas = root.querySelector('canvas')
  const startBtn = root.querySelector('[data-start]')
  const resetBtn = root.querySelector('[data-reset]')
  const lengthRange = root.querySelector('[data-length-range]')
  const angleRange = root.querySelector('[data-angle-range]')
  const periodLabel = root.querySelector('[data-period]')
  const lengthLabel = root.querySelector('[data-length-label]')
  const angleLabel = root.querySelector('[data-angle-label]')
  const lengthStat = root.querySelector('[data-length]')
  const angleStat = root.querySelector('[data-angle]')

  let L = 1.5
  let theta0 = 30
  let damping = 0.015
  let running = false
  let rafId = null
  const phys = { theta: (theta0 * Math.PI) / 180, omega: 0 }
  const trail = []

  function updateStats() {
    const T = (2 * Math.PI * Math.sqrt(L / G)).toFixed(2)
    if (periodLabel) periodLabel.textContent = `${T} s`
    if (lengthLabel) lengthLabel.textContent = `${L} m`
    if (angleLabel) angleLabel.textContent = `${theta0}°`
    if (lengthStat) lengthStat.textContent = `${L} m`
    if (angleStat) angleStat.textContent = `${theta0}°`
  }

  function drawInitial() {
    const ctx = canvas.getContext('2d')
    if (ctx) drawPendulum(ctx, phys.theta, L, [])
  }

  function reset() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    running = false
    phys.theta = (theta0 * Math.PI) / 180
    phys.omega = 0
    trail.length = 0
    drawInitial()
    updateStats()
  }

  function animate() {
    const dt = 1 / 60
    const alpha = -(G / L) * Math.sin(phys.theta) - damping * phys.omega
    phys.omega += alpha * dt
    phys.theta += phys.omega * dt
    trail.push(phys.theta)
    if (trail.length > 35) trail.shift()
    const ctx = canvas.getContext('2d')
    if (ctx) drawPendulum(ctx, phys.theta, L, trail)
    rafId = requestAnimationFrame(animate)
  }

  function handleLengthChange(event) {
    L = Number(event.target.value)
    if (lengthRange) lengthRange.value = L
    updateStats()
    reset()
  }

  function handleAngleChange(event) {
    theta0 = Number(event.target.value)
    if (angleRange) angleRange.value = theta0
    updateStats()
    reset()
  }

  function handleStart() {
    if (running) return
    running = true
    rafId = requestAnimationFrame(animate)
  }

  startBtn.addEventListener('click', handleStart)
  resetBtn.addEventListener('click', reset)
  lengthRange.addEventListener('input', handleLengthChange)
  angleRange.addEventListener('input', handleAngleChange)

  updateStats()
  drawInitial()

  container.appendChild(root)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    startBtn.removeEventListener('click', handleStart)
    resetBtn.removeEventListener('click', reset)
    lengthRange.removeEventListener('input', handleLengthChange)
    angleRange.removeEventListener('input', handleAngleChange)
    if (container.contains(root)) container.removeChild(root)
  }
}
