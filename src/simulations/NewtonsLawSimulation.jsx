import { htmlToElement } from '../utils/dom.js'
import './NewtonsLawSimulation.css';

export function mountNewtonsLawSimulation(container) {
  const root = htmlToElement(`
    <div class="newton-wrapper">
      <div class="sim-card">
        <h1> Newton's 2nd Law Simulator <small>F = ma Interactive</small></h1>
        <div class="sub">Input your parameters to dynamically visualize the relationship between Force, Mass, and Acceleration.</div>

        <div class="flex-dashboard">
          <div class="controls">
            <div class="mode-tabs">
              <button class="mode-btn active" data-mode="calcF">Solve for Force (F)</button>
              <button class="mode-btn" data-mode="calcA">Solve for Accel (a)</button>
            </div>

            <div class="control-group">
              <label><span style="color:#3b82f6"> Mass (m)</span></label>
              <input type="range" min="1" max="100" step="1" value="10" data-mass-range />
              <div class="param-row">
                <input type="number" class="num-input" value="10" data-mass-number />
                <span>kg</span>
              </div>
            </div>

            <div class="control-group" data-group-calcF>
              <label><span style="color:#10b981">⏩ Acceleration (a)</span></label>
              <input type="range" min="-20" max="20" step="0.5" value="5" data-accel-range />
              <div class="param-row">
                <input type="number" class="num-input" value="5" data-accel-number />
                <span>m/s²</span>
              </div>
            </div>

            <div class="control-group" data-group-calcA style="display:none;">
              <label><span style="color:#f43f5e"> Force (F)</span></label>
              <input type="range" min="-1000" max="1000" step="10" value="50" data-force-range />
              <div class="param-row">
                <input type="number" class="num-input" value="50" data-force-number />
                <span>N</span>
              </div>
            </div>

            <div class="formula-box" data-formula></div>
            <div class="formula-note">Notice how increasing mass decreases acceleration for a constant force.</div>
          </div>

          <div class="visualization">
            <canvas width="600" height="350" data-physics-canvas style="width: 100%; aspect-ratio: 600 / 350; flex: 1"></canvas>
            <div class="visual-note"> <strong>Visualizer:</strong> The block size represents mass, the red arrow represents the net force applied, and the green dashed arrow represents the resulting acceleration vector. The block speeds up across the screen according to the kinematic equations.</div>
          </div>
        </div>
      </div>
    </div>
  `)

  const modeButtons = Array.from(root.querySelectorAll('[data-mode]'))
  const massRange = root.querySelector('[data-mass-range]')
  const massNumber = root.querySelector('[data-mass-number]')
  const accelGroup = root.querySelector('[data-group-calcF]')
  const forceGroup = root.querySelector('[data-group-calcA]')
  const accelRange = root.querySelector('[data-accel-range]')
  const accelNumber = root.querySelector('[data-accel-number]')
  const forceRange = root.querySelector('[data-force-range]')
  const forceNumber = root.querySelector('[data-force-number]')
  const formulaBox = root.querySelector('[data-formula]')
  const canvas = root.querySelector('[data-physics-canvas]')

  let mode = 'calcF'
  let mass = 10
  let acceleration = 5
  let force = 50
  const simState = { x: 100, velocity: 0, lastTime: 0 }
  let rafId = null

  function updateDerived() {
    if (mode === 'calcF') {
      force = mass * acceleration
      if (forceRange) forceRange.value = force
      if (forceNumber) forceNumber.value = force
    } else {
      acceleration = mass > 0 ? force / mass : 0
      if (accelRange) accelRange.value = acceleration
      if (accelNumber) accelNumber.value = acceleration
    }
  }

  function updateFormula() {
    if (!formulaBox) return
    if (mode === 'calcF') {
      formulaBox.innerHTML = `<span class="var-f">F</span> = <span class="var-m">${mass}</span> × <span class="var-a">${acceleration}</span> = <span class="var-f">${force.toFixed(1)} N</span>`
    } else {
      formulaBox.innerHTML = `<span class="var-a">a</span> = <span class="var-f">${force}</span> / <span class="var-m">${mass}</span> = <span class="var-a">${acceleration.toFixed(2)} m/s²</span>`
    }
  }

  function setMode(newMode) {
    mode = newMode
    modeButtons.forEach(btn => {
      if (btn.dataset.mode === newMode) btn.classList.toggle('active', true)
      else btn.classList.toggle('active', false)
    })
    if (accelGroup) accelGroup.style.display = newMode === 'calcF' ? '' : 'none'
    if (forceGroup) forceGroup.style.display = newMode === 'calcA' ? '' : 'none'
    updateDerived()
    updateFormula()
  }

  function handleModeClick(event) {
    const requested = event.currentTarget.dataset.mode
    if (requested) {
      setMode(requested)
    }
  }

  function syncInputs() {
    if (massRange) massRange.value = mass
    if (massNumber) massNumber.value = mass
    if (accelRange) accelRange.value = acceleration
    if (accelNumber) accelNumber.value = acceleration
    if (forceRange) forceRange.value = force
    if (forceNumber) forceNumber.value = force
  }

  function handleMassChange(value) {
    mass = value
    syncInputs()
    updateDerived()
    updateFormula()
  }

  function handleAccelerationChange(value) {
    acceleration = value
    syncInputs()
    updateDerived()
    updateFormula()
  }

  function handleForceChange(value) {
    force = value
    syncInputs()
    updateDerived()
    updateFormula()
  }

  function drawLoop(timestamp) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dt = simState.lastTime ? (timestamp - simState.lastTime) / 1000 : 0
    simState.lastTime = timestamp
    const W = canvas.width
    const H = canvas.height
    simState.velocity += acceleration * dt
    const visualVel = Math.min(Math.max(simState.velocity, -200), 200) * 10
    simState.x += visualVel * dt
    if (simState.x > W + 100) {
      simState.x = -100
      simState.velocity = 0
    } else if (simState.x < -100) {
      simState.x = W + 100
      simState.velocity = 0
    }
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke() }
    for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke() }
    const groundY = H - 60
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(0, groundY, W, 60)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke()
    const baseSize = 40
    const blockSize = baseSize * Math.pow(mass / 10, 0.4)
    const bx = simState.x
    const by = groundY - blockSize
    if (Math.abs(force) > 0.1) {
      const arrowLen = Math.min(Math.max(Math.abs(force) * 1.5, 40), 200)
      const dir = force > 0 ? 1 : -1
      const startX = force > 0 ? bx - 10 : bx + blockSize + 10
      const endX = startX + dir * arrowLen
      const arrY = by + blockSize / 2
      ctx.strokeStyle = '#f43f5e'
      ctx.lineWidth = 6
      ctx.beginPath(); ctx.moveTo(startX, arrY); ctx.lineTo(endX, arrY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(endX, arrY); ctx.lineTo(endX - dir*12, arrY - 8); ctx.lineTo(endX - dir*12, arrY + 8); ctx.fillStyle = '#f43f5e'; ctx.fill()
      ctx.fillStyle = '#e11d48'
      ctx.font = 'bold 16px "Segoe UI"'
      ctx.fillText(`F = ${force.toFixed(1)} N`, Math.min(startX, endX) + Math.abs(arrowLen)/2 - 30, arrY - 15)
    }
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(bx, by, blockSize, blockSize)
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 3
    ctx.strokeRect(bx, by, blockSize, blockSize)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px "Segoe UI"'
    ctx.fillText(`${mass.toFixed(1)} kg`, bx + blockSize/2 - 25, by + blockSize/2 + 6)
    if (Math.abs(acceleration) > 0.1) {
      const accY = by - 30
      const accDir = acceleration > 0 ? 1 : -1
      const aLen = Math.min(Math.abs(acceleration) * 5 + 20, 80)
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3
      ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(bx + blockSize/2, accY); ctx.lineTo(bx + blockSize/2 + accDir * aLen, accY); ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath(); ctx.moveTo(bx + blockSize/2 + accDir * aLen, accY); ctx.lineTo(bx + blockSize/2 + accDir * aLen - accDir*8, accY - 6); ctx.lineTo(bx + blockSize/2 + accDir * aLen - accDir*8, accY + 6); ctx.fillStyle = '#10b981'; ctx.fill()
      ctx.fillStyle = '#059669'; ctx.font = 'bold 14px "Segoe UI"'; ctx.fillText(`a = ${acceleration.toFixed(1)} m/s²`, bx + blockSize/2 - 20, accY - 10)
    }
    rafId = window.requestAnimationFrame(drawLoop)
  }

  function handleMassInput(event) {
    handleMassChange(Number(event.target.value))
  }

  function handleAccelInput(event) {
    handleAccelerationChange(Number(event.target.value))
  }

  function handleForceInput(event) {
    handleForceChange(Number(event.target.value))
  }

  modeButtons.forEach(btn => btn.addEventListener('click', handleModeClick))
  if (massRange) massRange.addEventListener('input', handleMassInput)
  if (massNumber) massNumber.addEventListener('input', handleMassInput)
  if (accelRange) accelRange.addEventListener('input', handleAccelInput)
  if (accelNumber) accelNumber.addEventListener('input', handleAccelInput)
  if (forceRange) forceRange.addEventListener('input', handleForceInput)
  if (forceNumber) forceNumber.addEventListener('input', handleForceInput)

  setMode('calcF')
  syncInputs()
  updateDerived()
  updateFormula()

  canvas.width = 600
  canvas.height = 350
  rafId = requestAnimationFrame(drawLoop)
  container.appendChild(root)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    modeButtons.forEach(btn => btn.removeEventListener('click', handleModeClick))
    if (massRange) massRange.removeEventListener('input', handleMassInput)
    if (massNumber) massNumber.removeEventListener('input', handleMassInput)
    if (accelRange) accelRange.removeEventListener('input', handleAccelInput)
    if (accelNumber) accelNumber.removeEventListener('input', handleAccelInput)
    if (forceRange) forceRange.removeEventListener('input', handleForceInput)
    if (forceNumber) forceNumber.removeEventListener('input', handleForceInput)
    if (container.contains(root)) container.removeChild(root)
  }
}
