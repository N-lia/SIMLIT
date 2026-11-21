import { htmlToElement } from '../../../utils/dom.js'
import { renderKaTeXString } from '../../KaTeX.jsx'
import { FLUIDS, MATERIALS, G, cubeForces, equilibrium, stepCube } from './buoyancyModel.js'
import '../../Simulation.css'

const W = 760, H = 440
const FLOOR_PX = 400          // canvas y of the tank floor
const SCALE = 135             // pixels per metre
const TANK_LEFT = 110, TANK_RIGHT = 520
const TANK_HEIGHT_M = 2.5
const SURFACE_M = 1.6         // free-surface height above the floor
const BEAKER = { x: 590, w: 120, top: 150, bottom: 400 }
const BEAKER_CAPACITY_L = 220

const MATERIAL_COLORS = {
  cork: '#c9a36b',
  pine: '#d8b45c',
  ice: '#bfe3f2',
  pvc: '#9aa6b2',
  aluminium: '#b8bcc2',
  steel: '#5f6670',
  custom: '#a9402f',
}

const FLUID_COLORS = {
  fresh: [47, 93, 136],
  sea: [36, 110, 120],
  oil: [196, 156, 52],
  glycerin: [120, 140, 170],
  mercury: [140, 146, 152],
}

const toY = (m) => FLOOR_PX - m * SCALE

function arrow(ctx, x, y0, y1, color, label, labelSide = 'right') {
  const dir = Math.sign(y1 - y0) || 1
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 - dir * 8); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x - 7, y1 - dir * 11)
  ctx.lineTo(x + 7, y1 - dir * 11)
  ctx.closePath(); ctx.fill()
  ctx.font = "bold 12px 'IBM Plex Mono', monospace"
  if (labelSide === 'right') {
    ctx.textAlign = 'left'
    ctx.fillText(label, x + 10, y1 - dir * 4)
  } else {
    // Label beside the tail, to the left of the shaft.
    ctx.textAlign = 'right'
    ctx.fillText(label, x - 10, y0 + dir * 12)
  }
}

function drawScene(ctx, s) {
  const { side, y, fluid, material, forces, normal, maxForce } = s
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#fff4df'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(37,35,31,0.07)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let yy = 0; yy < H; yy += 40) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke() }

  // Fluid with a depth gradient (pressure grows with depth)
  const [r, g, b] = FLUID_COLORS[fluid.id] || FLUID_COLORS.fresh
  const surfacePx = toY(SURFACE_M)
  const grad = ctx.createLinearGradient(0, surfacePx, 0, FLOOR_PX)
  grad.addColorStop(0, `rgba(${r},${g},${b},0.22)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0.5)`)
  ctx.fillStyle = grad
  ctx.fillRect(TANK_LEFT, surfacePx, TANK_RIGHT - TANK_LEFT, FLOOR_PX - surfacePx)
  ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(TANK_LEFT, surfacePx); ctx.lineTo(TANK_RIGHT, surfacePx); ctx.stroke()

  // Tank walls
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(TANK_LEFT, toY(TANK_HEIGHT_M))
  ctx.lineTo(TANK_LEFT, FLOOR_PX)
  ctx.lineTo(TANK_RIGHT, FLOOR_PX)
  ctx.lineTo(TANK_RIGHT, toY(TANK_HEIGHT_M))
  ctx.stroke()

  // Depth scale
  ctx.fillStyle = 'rgba(37,35,31,0.6)'
  ctx.font = "11px 'IBM Plex Mono', monospace"
  ctx.textAlign = 'right'
  for (let m = 0; m <= TANK_HEIGHT_M + 1e-9; m += 0.5) {
    const py = toY(m)
    ctx.fillRect(TANK_LEFT - 8, py, 6, 1)
    ctx.fillText(`${m.toFixed(1)} m`, TANK_LEFT - 12, py + 4)
  }

  // Cube
  const sidePx = side * SCALE
  const cx = (TANK_LEFT + TANK_RIGHT) / 2
  const left = cx - sidePx / 2
  const top = toY(y + side)
  ctx.fillStyle = MATERIAL_COLORS[material.id] || MATERIAL_COLORS.custom
  ctx.fillRect(left, top, sidePx, sidePx)
  // Submerged part tinted by the fluid
  if (forces.depth > 0) {
    const subTop = toY(y + forces.depth)
    ctx.fillStyle = `rgba(${r},${g},${b},0.28)`
    ctx.fillRect(left, subTop, sidePx, forces.depth * SCALE)
  }
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 2
  ctx.strokeRect(left, top, sidePx, sidePx)

  // Force arrows (length proportional to force)
  const len = (F) => 18 + (F / maxForce) * 110
  // Weight is drawn pressing down onto the top face so it never runs into the floor.
  const wTail = Math.max(16, top - len(forces.weight))
  arrow(ctx, cx - 22, wTail, top, '#a9402f', `W ${forces.weight.toFixed(0)} N`, 'left')
  if (forces.buoyant > 0.5) {
    const bc = toY(y + forces.depth / 2)
    arrow(ctx, cx + 22, bc, bc - len(forces.buoyant), '#2f5d88', `F_B ${forces.buoyant.toFixed(0)} N`)
  }
  if (normal > 0.5) {
    arrow(ctx, cx + sidePx / 2 + 18, FLOOR_PX, FLOOR_PX - len(normal), '#4c7a3c', `N ${normal.toFixed(0)} N`)
  }

  // Beaker of displaced fluid: same weight as the buoyant force
  const litres = forces.displaced * 1000
  const fill = Math.min(1, litres / BEAKER_CAPACITY_L)
  const bh = BEAKER.bottom - BEAKER.top
  ctx.fillStyle = `rgba(${r},${g},${b},0.42)`
  ctx.fillRect(BEAKER.x, BEAKER.bottom - fill * bh, BEAKER.w, fill * bh)
  ctx.strokeStyle = '#25231f'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(BEAKER.x, BEAKER.top)
  ctx.lineTo(BEAKER.x, BEAKER.bottom)
  ctx.lineTo(BEAKER.x + BEAKER.w, BEAKER.bottom)
  ctx.lineTo(BEAKER.x + BEAKER.w, BEAKER.top)
  ctx.stroke()
  ctx.fillStyle = 'rgba(37,35,31,0.5)'
  for (let l = 50; l < BEAKER_CAPACITY_L; l += 50) {
    const py = BEAKER.bottom - (l / BEAKER_CAPACITY_L) * bh
    ctx.fillRect(BEAKER.x, py, 10, 1)
  }
  ctx.fillStyle = '#25231f'
  ctx.textAlign = 'center'
  ctx.font = "bold 11px 'IBM Plex Mono', monospace"
  ctx.fillText('displaced fluid', BEAKER.x + BEAKER.w / 2, BEAKER.top - 26)
  ctx.font = "11px 'IBM Plex Mono', monospace"
  ctx.fillText(`${litres.toFixed(1)} L · ${forces.buoyant.toFixed(0)} N`, BEAKER.x + BEAKER.w / 2, BEAKER.top - 10)
  ctx.textAlign = 'left'
}

function buttonGrid(items, attr, activeId) {
  return items
    .map((item) => `<button type="button" data-${attr}="${item.id}" class="${item.id === activeId ? 'on' : ''}">${item.label}<br><small>${item.rho} kg/m³</small></button>`)
    .join('')
}

export function mountBuoyancySimulation(container) {
  const ktex = (math, display = false) => renderKaTeXString(math, display)
  const root = htmlToElement(`
    <div class="sim-inner focused-sim buoyancy-sim">
      <div class="focused-header">
        <div>
          <span class="focused-logo">Buoyancy Lab</span>
          <span class="focused-subtitle">Archimedes' principle · floating vs sinking · displaced fluid</span>
        </div>
        <div class="focused-badge">${ktex('F_B=\\rho_f\\,g\\,V_{sub}')}</div>
      </div>
      <div class="focused-grid">
        <div class="focused-canvas-panel">
          <canvas class="sim-canvas" width="${W}" height="${H}"></canvas>
          <div class="panel-tag"><span data-scene style="color: var(--t2)"></span> — <span data-tag>SETTLING</span></div>
        </div>
        <div class="focused-right-col">
          <div class="focused-panel">
            <div class="section-title">Fluid</div>
            <div class="mode-grid three" data-fluids>${buttonGrid(FLUIDS, 'fluid', 'fresh')}</div>
            <div class="section-title">Object</div>
            <div class="mode-grid three" data-materials>${buttonGrid(MATERIALS, 'material', 'pine')}</div>
            <div class="control-row">
              <label>Object density <span class="ctrl-val" data-rho-label></span></label>
              <input type="range" min="100" max="8000" step="10" value="500" data-rho-range />
            </div>
            <div class="control-row">
              <label>Cube side <span class="ctrl-val" data-side-label></span></label>
              <input type="range" min="0.2" max="0.6" step="0.02" value="0.4" data-side-range />
            </div>
            <div class="mode-grid">
              <button type="button" data-drop>Drop from above</button>
              <button type="button" data-push>Push to the floor</button>
            </div>
          </div>
          <div class="focused-readout-grid two">
            <div class="readout"><div class="readout-label">Weight ${ktex('W')}</div><div class="readout-val red" data-weight></div></div>
            <div class="readout"><div class="readout-label">Buoyancy ${ktex('F_B')}</div><div class="readout-val cyan" data-buoyant></div></div>
            <div class="readout"><div class="readout-label">Submerged</div><div class="readout-val amber" data-fraction></div></div>
            <div class="readout"><div class="readout-label">Apparent weight</div><div class="readout-val green" data-apparent></div></div>
            <div class="readout wide"><div class="readout-label">At rest</div><div class="readout-note" data-prediction></div></div>
          </div>
        </div>
      </div>
    </div>
  `)

  const canvas = root.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const q = (sel) => root.querySelector(sel)
  const rhoRange = q('[data-rho-range]')
  const sideRange = q('[data-side-range]')
  const fluidGrid = q('[data-fluids]')
  const materialGrid = q('[data-materials]')
  const dropBtn = q('[data-drop]')
  const pushBtn = q('[data-push]')
  const out = {
    rho: q('[data-rho-label]'),
    side: q('[data-side-label]'),
    weight: q('[data-weight]'),
    buoyant: q('[data-buoyant]'),
    fraction: q('[data-fraction]'),
    apparent: q('[data-apparent]'),
    prediction: q('[data-prediction]'),
    tag: q('[data-tag]'),
    scene: q('[data-scene]'),
  }

  let fluid = FLUIDS[0]
  let material = MATERIALS.find((m) => m.id === 'pine')
  let rhoObj = material.rho
  let side = 0.4
  let state = { y: SURFACE_M + 0.5, v: 0 }
  let rafId = null
  let last = null

  const params = () => ({ side, rhoObj, rhoFluid: fluid.rho, surfaceY: SURFACE_M })

  function setActive(grid, attr, id) {
    grid.querySelectorAll('button').forEach((btn) => btn.classList.toggle('on', btn.dataset[attr] === id))
  }

  function updateReadouts(forces, eq) {
    const p = params()
    out.rho.textContent = `${rhoObj} kg/m³`
    out.side.textContent = `${side.toFixed(2)} m`
    out.weight.textContent = `${forces.weight.toFixed(1)} N`
    out.buoyant.textContent = `${forces.buoyant.toFixed(1)} N`
    out.fraction.textContent = `${((forces.depth / side) * 100).toFixed(0)} %`
    out.apparent.textContent = `${Math.max(0, forces.weight - forces.buoyant).toFixed(1)} N`
    const ratio = (p.rhoObj / p.rhoFluid).toFixed(3)
    out.prediction.innerHTML = eq.floats
      ? `Floats with ${(eq.fraction * 100).toFixed(1)}% under the surface, because ρ<sub>obj</sub>/ρ<sub>fluid</sub> = ${ratio} &lt; 1. The displaced fluid weighs exactly ${forces.weight.toFixed(1)} N.`
      : `Sinks, because ρ<sub>obj</sub>/ρ<sub>fluid</sub> = ${ratio} ≥ 1. Buoyancy (${(eq.fraction * p.rhoFluid * side ** 3 * G).toFixed(1)} N) can't carry the weight, so the floor pushes back with ${eq.normal.toFixed(1)} N.`
    const settled = Math.abs(state.v) < 0.02 && Math.abs(state.y - eq.bottomY) < 0.01
    out.scene.textContent = `${material.id === 'custom' ? 'Custom block' : material.label} in ${fluid.label.toLowerCase()}`
    out.tag.textContent = settled ? (eq.floats ? 'FLOATING' : 'RESTING ON FLOOR') : 'SETTLING'
  }

  function render() {
    const p = params()
    const forces = cubeForces({ ...p, bottomY: state.y })
    const eq = equilibrium(p)
    const normal = state.y <= 0 ? Math.max(0, forces.weight - forces.buoyant) : 0
    const maxForce = Math.max(forces.weight, p.rhoFluid * side ** 3 * G, 1)
    drawScene(ctx, { side, y: state.y, fluid, material, forces, normal, maxForce })
    updateReadouts(forces, eq)
  }

  function tick(now) {
    if (last === null) last = now
    const elapsed = Math.min(0.05, (now - last) / 1000)
    last = now
    const steps = 4
    for (let i = 0; i < steps; i++) state = stepCube(state, params(), elapsed / steps)
    // Keep the cube inside the tank opening.
    state.y = Math.min(state.y, TANK_HEIGHT_M + 0.3)
    render()
    rafId = requestAnimationFrame(tick)
  }

  function onFluid(e) {
    const btn = e.target.closest('[data-fluid]')
    if (!btn) return
    fluid = FLUIDS.find((f) => f.id === btn.dataset.fluid) || fluid
    setActive(fluidGrid, 'fluid', fluid.id)
  }

  function onMaterial(e) {
    const btn = e.target.closest('[data-material]')
    if (!btn) return
    material = MATERIALS.find((m) => m.id === btn.dataset.material) || material
    rhoObj = material.rho
    rhoRange.value = rhoObj
    setActive(materialGrid, 'material', material.id)
  }

  function onRho() {
    rhoObj = Number(rhoRange.value)
    const match = MATERIALS.find((m) => m.rho === rhoObj)
    material = match || { id: 'custom', label: 'Custom', rho: rhoObj }
    setActive(materialGrid, 'material', material.id)
  }

  function onSide() {
    side = Number(sideRange.value)
  }

  function drop() { state = { y: SURFACE_M + 0.5, v: 0 } }
  function push() { state = { y: 0, v: 0 } }

  fluidGrid.addEventListener('click', onFluid)
  materialGrid.addEventListener('click', onMaterial)
  rhoRange.addEventListener('input', onRho)
  sideRange.addEventListener('input', onSide)
  dropBtn.addEventListener('click', drop)
  pushBtn.addEventListener('click', push)

  render()
  rafId = requestAnimationFrame(tick)
  container.appendChild(root)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    fluidGrid.removeEventListener('click', onFluid)
    materialGrid.removeEventListener('click', onMaterial)
    rhoRange.removeEventListener('input', onRho)
    sideRange.removeEventListener('input', onSide)
    dropBtn.removeEventListener('click', drop)
    pushBtn.removeEventListener('click', push)
    if (container.contains(root)) container.removeChild(root)
  }
}
