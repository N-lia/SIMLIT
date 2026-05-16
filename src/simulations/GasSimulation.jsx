import { htmlToElement } from '../utils/dom.js'
import './Simulation.css'

const W = 380, H = 210
const BOX = { x: 60, y: 20, w: W - 120, h: H - 50 }
const COLORS = ['#f87171','#fb923c','#facc15','#4ade80','#60a5fa','#c084fc','#f472b6']
const R = 8.314

function initParticles(n, speed) {
  return Array.from({ length: n }, (_, i) => ({
    x: BOX.x + 20 + Math.random() * (BOX.w - 40),
    y: BOX.y + 20 + Math.random() * (BOX.h - 40),
    vx: (Math.random() - 0.5) * speed * 2,
    vy: (Math.random() - 0.5) * speed * 2,
    r: 5,
    color: COLORS[i % COLORS.length],
  }))
}

function stepParticles(particles, speed) {
  for (const p of particles) {
    p.x += p.vx * 0.9
    p.y += p.vy * 0.9
    // Normalise speed
    const s = Math.hypot(p.vx, p.vy)
    if (s > 0) { p.vx = (p.vx / s) * speed; p.vy = (p.vy / s) * speed }
    if (p.x - p.r < BOX.x)          { p.x = BOX.x + p.r;          p.vx = Math.abs(p.vx) }
    if (p.x + p.r > BOX.x + BOX.w)  { p.x = BOX.x + BOX.w - p.r;  p.vx = -Math.abs(p.vx) }
    if (p.y - p.r < BOX.y)          { p.y = BOX.y + p.r;          p.vy = Math.abs(p.vy) }
    if (p.y + p.r > BOX.y + BOX.h)  { p.y = BOX.y + BOX.h - p.r;  p.vy = -Math.abs(p.vy) }
  }
}

function drawFrame(ctx, particles, temp) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, W, H)

  // Container
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 2
  ctx.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h)

  // Temperature heat tint
  const heat = Math.min((temp - 100) / 900, 1)
  ctx.fillStyle = `rgba(232,93,42,${heat * 0.08})`
  ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h)

  // Particles
  for (const p of particles) {
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.8)
    grd.addColorStop(0, p.color)
    grd.addColorStop(1, p.color + '00')
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.8, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
  }

  // Labels
  ctx.font = '11px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.textAlign = 'center'; ctx.fillText(`T = ${temp} K`, BOX.x + BOX.w/2, H - 8)
}

export function mountGasSimulation(container) {
  const root = htmlToElement(`
    <div class="sim-inner">
      <div class="canvas-area">
        <canvas class="sim-canvas" width="${W}" height="${H}"></canvas>
        <div class="sim-stats">
          <div class="stat"><span class="stat-label">Pressure</span><span class="stat-val" data-pressure></span></div>
          <div class="stat"><span class="stat-label">Particles</span><span class="stat-val" data-particles></span></div>
          <div class="stat"><span class="stat-label">Speed ~</span><span class="stat-val" data-speed></span></div>
        </div>
      </div>
      <div class="controls-panel">
        <div class="control-row">
          <label>Temperature <span class="ctrl-val" data-temp-label></span></label>
          <input type="range" min="100" max="1000" step="10" value="300" data-temp-range />
        </div>
        <div class="control-row">
          <label>Moles (n) <span class="ctrl-val" data-moles-label></span></label>
          <input type="range" min="1" max="5" value="2" step="1" data-moles-range />
        </div>
      </div>
    </div>
  `)

  const canvas = root.querySelector('canvas')
  const tempRange = root.querySelector('[data-temp-range]')
  const molesRange = root.querySelector('[data-moles-range]')
  const tempLabel = root.querySelector('[data-temp-label]')
  const molesLabel = root.querySelector('[data-moles-label]')
  const pressureLabel = root.querySelector('[data-pressure]')
  const particlesLabel = root.querySelector('[data-particles]')
  const speedLabel = root.querySelector('[data-speed]')

  let temp = 300
  let moles = 2
  let particles = initParticles(Math.round(moles * 5), Math.sqrt(temp / 300) * 2.4)
  let rafId = null

  function computeStats() {
    const n = Math.round(moles * 5)
    const speed = Math.sqrt(temp / 300) * 2.4
    const V = (BOX.w * BOX.h) * 1e-6
    const pressure = (moles * R * temp / V / 1e6).toFixed(3)
    return { n, speed, pressure }
  }

  function updateLabels() {
    const { n, speed, pressure } = computeStats()
    if (pressureLabel) pressureLabel.textContent = `${pressure} MPa`
    if (particlesLabel) particlesLabel.textContent = n
    if (speedLabel) speedLabel.textContent = `${speed.toFixed(1)} u/s`
    if (tempLabel) tempLabel.textContent = `${temp} K`
    if (molesLabel) molesLabel.textContent = `${moles} mol`
  }

  function resetParticles() {
    particles = initParticles(Math.round(moles * 5), Math.sqrt(temp / 300) * 2.4)
    updateLabels()
  }

  function animate() {
    const speed = Math.sqrt(temp / 300) * 2.4
    stepParticles(particles, speed)
    const ctx = canvas.getContext('2d')
    if (ctx) drawFrame(ctx, particles, temp, moles)
    updateLabels()
    rafId = requestAnimationFrame(animate)
  }

  function handleTempChange(event) {
    temp = Number(event.target.value)
    tempLabel.textContent = `${temp} K`
    resetParticles()
  }

  function handleMolesChange(event) {
    moles = Number(event.target.value)
    molesLabel.textContent = `${moles} mol`
    resetParticles()
  }

  tempRange.addEventListener('input', handleTempChange)
  molesRange.addEventListener('input', handleMolesChange)

  updateLabels()
  animate()

  container.appendChild(root)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    tempRange.removeEventListener('input', handleTempChange)
    molesRange.removeEventListener('input', handleMolesChange)
    if (container.contains(root)) container.removeChild(root)
  }
}
