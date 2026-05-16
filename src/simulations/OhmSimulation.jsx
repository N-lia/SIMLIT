import { useRef, useState, useEffect, useCallback } from 'react'
import './Simulation.css'

const W = 380, H = 210

function drawOhm(ctx, voltage, resistance, dotOffset) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f1117'
  ctx.fillRect(0, 0, W, H)

  const current = voltage / resistance
  const power   = voltage * current

  // Circuit coordinates
  const top = 45, bot = H - 45, left = 50, right = W - 50
  const midX = W / 2

  // Wires
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  // top wire: battery+ → right → bulb
  ctx.moveTo(left, top); ctx.lineTo(right, top)
  // right wire
  ctx.moveTo(right, top); ctx.lineTo(right, bot)
  // bottom wire: bulb → resistor → battery-
  ctx.moveTo(right, bot); ctx.lineTo(left, bot)
  // left wire
  ctx.moveTo(left, top); ctx.lineTo(left, bot)
  ctx.stroke()

  // ── Battery (left side) ──
  const bmy = (top + bot) / 2
  const plateW = 18
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(left - plateW/2, bmy - 12); ctx.lineTo(left + plateW/2, bmy - 12); ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(left - plateW*0.35, bmy - 6); ctx.lineTo(left + plateW*0.35, bmy - 6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(left - plateW/2, bmy + 6); ctx.lineTo(left + plateW/2, bmy + 6); ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(left - plateW*0.35, bmy + 12); ctx.lineTo(left + plateW*0.35, bmy + 12); ctx.stroke()
  ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = '#facc15'; ctx.textAlign = 'center'
  ctx.fillText(`${voltage}V`, left, bmy + 30)

  // ── Resistor (bottom wire) ──
  const rsy = bot, rzx = midX - 28
  ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(rzx, rsy)
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(rzx + 8 + i * 9, rsy - (i % 2 === 0 ? 10 : -10))
  }
  ctx.lineTo(rzx + 56, rsy)
  ctx.stroke()
  ctx.fillStyle = '#60a5fa'; ctx.font = '10px Outfit, sans-serif'
  ctx.fillText(`${resistance}Ω`, midX, rsy + 16)

  // ── Bulb (right side) ──
  const bulbX = right, bulbY = (top + bot) / 2
  const brightness = Math.min(power / 6, 1)  // 0→1
  const glowR = 6 + brightness * 22
  const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, glowR)
  glowGrad.addColorStop(0, `rgba(253,224,71,${brightness * 0.7})`)
  glowGrad.addColorStop(1, 'rgba(253,224,71,0)')
  ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(bulbX, bulbY, glowR, 0, Math.PI*2); ctx.fill()

  const bulbColor = `rgba(253,224,71,${0.25 + brightness * 0.75})`
  ctx.strokeStyle = bulbColor; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(bulbX, bulbY, 12, 0, Math.PI*2); ctx.stroke()
  ctx.fillStyle = `rgba(253,224,71,${brightness * 0.3})`
  ctx.beginPath(); ctx.arc(bulbX, bulbY, 12, 0, Math.PI*2); ctx.fill()
  // filament
  ctx.strokeStyle = bulbColor; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(bulbX-4, bulbY+3); ctx.lineTo(bulbX-2, bulbY-3); ctx.lineTo(bulbX+2, bulbY+3); ctx.lineTo(bulbX+4, bulbY-3); ctx.stroke()

  // ── Animated electron dots ──
  const speed = Math.min(current * 18, 60)
  const dotSpacing = 38
  const totalPath = 2 * (right - left) + 2 * (bot - top)
  const numDots = 8

  ctx.fillStyle = '#34d399'
  for (let i = 0; i < numDots; i++) {
    let d = ((dotOffset + i * dotSpacing) % totalPath + totalPath) % totalPath
    let x, y
    const seg1 = right - left, seg2 = bot - top, seg3 = right - left, seg4 = bot - top
    if (d < seg1)       { x = left + d;      y = top }
    else if (d < seg1 + seg2) { x = right; y = top + (d - seg1) }
    else if (d < 2*seg1+seg2) { x = right - (d - seg1 - seg2); y = bot }
    else                { x = left;  y = bot - (d - 2*seg1 - seg2) }
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill()
  }

  return { current, power }
}

export default function OhmSimulation() {
  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const offsetRef  = useRef(0)
  const [voltage,    setVoltage]    = useState(9)
  const [resistance, setResistance] = useState(30)
  const [stats, setStats] = useState({ current: 0.3, power: 2.7 })

  const animate = useCallback(() => {
    const current = voltage / resistance
    offsetRef.current = (offsetRef.current + Math.min(current * 18, 60) / 60) % 1000
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const s = drawOhm(ctx, voltage, resistance, offsetRef.current)
    setStats(s)
    rafRef.current = requestAnimationFrame(animate)
  }, [voltage, resistance])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  return (
    <div className="sim-inner">
      <div className="canvas-area">
        <canvas ref={canvasRef} className="sim-canvas" width={W} height={H} />
        <div className="sim-stats">
          <div className="stat"><span className="stat-label">Current</span><span className="stat-val">{stats.current?.toFixed(3)} A</span></div>
          <div className="stat"><span className="stat-label">Power</span><span className="stat-val">{stats.power?.toFixed(2)} W</span></div>
        </div>
      </div>
      <div className="controls-panel">
        <div className="control-row">
          <label>Voltage <span className="ctrl-val">{voltage} V</span></label>
          <input type="range" min="1" max="24" value={voltage} onChange={e => setVoltage(+e.target.value)} />
        </div>
        <div className="control-row">
          <label>Resistance <span className="ctrl-val">{resistance} Ω</span></label>
          <input type="range" min="1" max="100" value={resistance} onChange={e => setResistance(+e.target.value)} />
        </div>
      </div>
    </div>
  )
}
