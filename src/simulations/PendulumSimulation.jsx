import { useRef, useState, useEffect, useCallback } from 'react'
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

export default function PendulumSimulation() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const physRef   = useRef({ theta: Math.PI/6, omega: 0, t: 0 })
  const trailRef  = useRef([])

  const [L,       setL]       = useState(1.5)
  const [theta0,  setTheta0]  = useState(30)
  const [damping, setDamping] = useState(0.015)
  const [running, setRunning] = useState(false)

  const T = (2 * Math.PI * Math.sqrt(L / G)).toFixed(2)

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setRunning(false)
    physRef.current = { theta: (theta0 * Math.PI) / 180, omega: 0 }
    trailRef.current = []
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) drawPendulum(ctx, physRef.current.theta, L, [])
  }, [L, theta0])

  useEffect(() => { reset() }, [reset])

  useEffect(() => {
    if (!running) return
    const dt = 1 / 60
    const loop = () => {
      const p = physRef.current
      const alpha = -(G / L) * Math.sin(p.theta) - damping * p.omega
      p.omega += alpha * dt
      p.theta += p.omega * dt
      trailRef.current.push(p.theta)
      if (trailRef.current.length > 35) trailRef.current.shift()
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) drawPendulum(ctx, p.theta, L, trailRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, L, damping])

  return (
    <div className="sim-inner">
      <div className="canvas-area">
        <canvas ref={canvasRef} className="sim-canvas" width={W} height={H} />
        <div className="sim-stats">
          <div className="stat"><span className="stat-label">Period T</span><span className="stat-val">{T} s</span></div>
          <div className="stat"><span className="stat-label">Length</span><span className="stat-val">{L} m</span></div>
          <div className="stat"><span className="stat-label">Angle₀</span><span className="stat-val">{theta0}°</span></div>
        </div>
      </div>
      <div className="controls-panel">
        <div className="control-row">
          <label>Length <span className="ctrl-val">{L} m</span></label>
          <input type="range" min="0.5" max="3" step="0.1" value={L} onChange={e => { setL(+e.target.value); reset() }} />
        </div>
        <div className="control-row">
          <label>Initial Angle <span className="ctrl-val">{theta0}°</span></label>
          <input type="range" min="5" max="60" value={theta0} onChange={e => { setTheta0(+e.target.value); reset() }} />
        </div>
        <div className="ctrl-buttons">
          <button className="ctrl-btn-primary" onClick={() => setRunning(true)} disabled={running}>▶ Start</button>
          <button className="ctrl-btn-secondary" onClick={reset}>↺ Reset</button>
        </div>
      </div>
    </div>
  )
}
