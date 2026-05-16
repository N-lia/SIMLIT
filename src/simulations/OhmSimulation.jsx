import { htmlToElement } from '../utils/dom.js'
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
  const dotSpacing = 38
  const totalPath = 2 * (right - left) + 2 * (bot - top)
  const numDots = 8

  ctx.fillStyle = '#34d399'
  for (let i = 0; i < numDots; i++) {
    let d = ((dotOffset + i * dotSpacing) % totalPath + totalPath) % totalPath
    let x, y
    const seg1 = right - left, seg2 = bot - top
    if (d < seg1)       { x = left + d;      y = top }
    else if (d < seg1 + seg2) { x = right; y = top + (d - seg1) }
    else if (d < 2*seg1+seg2) { x = right - (d - seg1 - seg2); y = bot }
    else                { x = left;  y = bot - (d - 2*seg1 - seg2) }
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill()
  }

  return { current, power }
}

export function mountOhmSimulation(container) {
  const root = htmlToElement(`
    <div class="sim-inner">
      <div class="canvas-area">
        <canvas class="sim-canvas" width="${W}" height="${H}"></canvas>
        <div class="sim-stats">
          <div class="stat"><span class="stat-label">Current</span><span class="stat-val" data-current></span></div>
          <div class="stat"><span class="stat-label">Power</span><span class="stat-val" data-power></span></div>
        </div>
      </div>
      <div class="controls-panel">
        <div class="control-row">
          <label>Voltage <span class="ctrl-val" data-voltage-label></span></label>
          <input type="range" min="1" max="24" value="9" data-voltage-range />
        </div>
        <div class="control-row">
          <label>Resistance <span class="ctrl-val" data-resistance-label></span></label>
          <input type="range" min="1" max="100" value="30" data-resistance-range />
        </div>
      </div>
    </div>
  `)

  const canvas = root.querySelector('canvas')
  const voltageRange = root.querySelector('[data-voltage-range]')
  const resistanceRange = root.querySelector('[data-resistance-range]')
  const voltageLabel = root.querySelector('[data-voltage-label]')
  const resistanceLabel = root.querySelector('[data-resistance-label]')
  const currentLabel = root.querySelector('[data-current]')
  const powerLabel = root.querySelector('[data-power]')

  let voltage = 9
  let resistance = 30
  let offset = 0
  let rafId = null

  function updateStats(stats) {
    if (currentLabel) currentLabel.textContent = `${stats.current.toFixed(3)} A`
    if (powerLabel) powerLabel.textContent = `${stats.power.toFixed(2)} W`
    if (voltageLabel) voltageLabel.textContent = `${voltage} V`
    if (resistanceLabel) resistanceLabel.textContent = `${resistance} Ω`
  }

  function animate() {
    const current = voltage / resistance
    offset = (offset + Math.min(current * 18, 60) / 60) % 1000
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const stats = drawOhm(ctx, voltage, resistance, offset)
      updateStats(stats)
    }
    rafId = requestAnimationFrame(animate)
  }

  function handleVoltageChange(event) {
    voltage = Number(event.target.value)
    if (voltageLabel) voltageLabel.textContent = `${voltage} V`
  }

  function handleResistanceChange(event) {
    resistance = Number(event.target.value)
    if (resistanceLabel) resistanceLabel.textContent = `${resistance} Ω`
  }

  voltageRange.addEventListener('input', handleVoltageChange)
  resistanceRange.addEventListener('input', handleResistanceChange)

  updateStats({ current: voltage / resistance, power: voltage * (voltage / resistance) })
  animate()

  container.appendChild(root)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    voltageRange.removeEventListener('input', handleVoltageChange)
    resistanceRange.removeEventListener('input', handleResistanceChange)
    if (container.contains(root)) container.removeChild(root)
  }
}
