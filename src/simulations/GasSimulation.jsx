import { useRef, useState, useEffect, useCallback } from 'react'
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

function drawFrame(ctx, particles, temp, moles) {
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

export default function GasSimulation() {
  const canvasRef   = useRef(null)
  const rafRef      = useRef(null)
  const particleRef = useRef([])

  const [temp,  setTemp]  = useState(300)
  const [moles, setMoles] = useState(2)

  const n = Math.round(moles * 5)
  const speed = Math.sqrt(temp / 300) * 2.4
  const V = (BOX.w * BOX.h) * 1e-6
  const pressure = (moles * R * temp / V / 1e6).toFixed(3)

  useEffect(() => {
    particleRef.current = initParticles(n, speed)
  }, [n])

  const animate = useCallback(() => {
    stepParticles(particleRef.current, speed)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) drawFrame(ctx, particleRef.current, temp, moles)
    rafRef.current = requestAnimationFrame(animate)
  }, [speed, temp, moles])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  return (
    <div className="sim-inner">
      <div className="canvas-area">
        <canvas ref={canvasRef} className="sim-canvas" width={W} height={H} />
        <div className="sim-stats">
          <div className="stat"><span className="stat-label">Pressure</span><span className="stat-val">{pressure} MPa</span></div>
          <div className="stat"><span className="stat-label">Particles</span><span className="stat-val">{n}</span></div>
          <div className="stat"><span className="stat-label">Speed ~</span><span className="stat-val">{speed.toFixed(1)} u/s</span></div>
        </div>
      </div>
      <div className="controls-panel">
        <div className="control-row">
          <label>Temperature <span className="ctrl-val">{temp} K</span></label>
          <input type="range" min="100" max="1000" step="10" value={temp} onChange={e => setTemp(+e.target.value)} />
        </div>
        <div className="control-row">
          <label>Moles (n) <span className="ctrl-val">{moles} mol</span></label>
          <input type="range" min="1" max="5" value={moles} onChange={e => setMoles(+e.target.value)} />
        </div>
      </div>
    </div>
  )
}
