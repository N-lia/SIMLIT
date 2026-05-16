import { htmlToElement } from '../utils/dom.js'
import './Simulation.css'

const W = 380, H = 210, G = 9.8

function drawPendulum(ctx, theta, L, trail) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f1117'
  ctx.fillRect(0, 0, W, H)

  // Subtle radial bg
  const bg = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, H*1.2)
  bg.addColorStop(0, 'rgba(139,92,246,0.08)')
  bg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  const px = W / 2, py = 30
  const scale = (H - 50) / 3.2
  const bx = px + Math.sin(theta) * L * scale
  const by = py + Math.cos(theta) * L * scale

  // Ghost trail
  ctx.lineWidth = 2
  trail.forEach((t, i) => {
    const tx = px + Math.sin(t) * L * scale
    const ty = py + Math.cos(t) * L * scale
    ctx.strokeStyle = `rgba(139,92,246,${(i / trail.length) * 0.3})`
    if (i === 0) { ctx.beginPath(); ctx.moveTo(tx, ty) }
    else ctx.lineTo(tx, ty)
  })
  if (trail.length > 1) ctx.stroke()

  // Rod
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke()

  // Pivot
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill()

  // Ceiling bracket
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(px-24, py-4); ctx.lineTo(px+24, py-4); ctx.stroke()

  // Bob glow
  const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 20)
  grd.addColorStop(0, 'rgba(139,92,246,0.4)')
  grd.addColorStop(1, 'rgba(139,92,246,0)')
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(bx, by, 20, 0, Math.PI*2); ctx.fill()

  // Bob
  const bobGrad = ctx.createRadialGradient(bx-4, by-4, 1, bx, by, 14)
  bobGrad.addColorStop(0, '#c084fc')
  bobGrad.addColorStop(1, '#7c3aed')
  ctx.fillStyle = bobGrad; ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(bx-4, by-4, 3, 0, Math.PI*2); ctx.fill()
}

export function mountPendulumSimulation(container) {
  const root = htmlToElement(`
    <div class="sim-inner">
      <div class="canvas-area">
        <canvas class="sim-canvas" width="${W}" height="${H}"></canvas>
        <div class="sim-stats">
          <div class="stat"><span class="stat-label">Period T</span><span class="stat-val" data-period></span></div>
          <div class="stat"><span class="stat-label">Length</span><span class="stat-val" data-length></span></div>
          <div class="stat"><span class="stat-label">Angle₀</span><span class="stat-val" data-angle></span></div>
        </div>
      </div>
      <div class="controls-panel">
        <div class="control-row">
          <label>Length <span class="ctrl-val" data-length-label></span></label>
          <input type="range" min="0.5" max="3" step="0.1" value="1.5" data-length-range />
        </div>
        <div class="control-row">
          <label>Initial Angle <span class="ctrl-val" data-angle-label></span></label>
          <input type="range" min="5" max="60" value="30" data-angle-range />
        </div>
        <div class="ctrl-buttons">
          <button class="ctrl-btn-primary" type="button" data-start>▶ Start</button>
          <button class="ctrl-btn-secondary" type="button" data-reset>↺ Reset</button>
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
