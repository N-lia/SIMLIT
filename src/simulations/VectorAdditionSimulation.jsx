import { htmlToElement } from '../utils/dom.js'
import './VectorAdditionSimulation.css'

const SAMPLE_FORMULAS = [
  '(3, 2) + (2, -1)',
  'A = (4, 1); B = (-2, 3); A + B',
  '2 * [1, 3] - <4, 1>',
  '3i + 2j + (-1i + 4j)',
]

function round(value, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0
}

function splitTopLevel(input, separator) {
  const parts = []
  let depth = 0
  let current = ''

  for (const char of input) {
    if ('([{<'.includes(char)) depth += 1
    if (')]}>'.includes(char)) depth -= 1

    if (char === separator && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

function splitExpressionTerms(expression) {
  const terms = []
  let depth = 0
  let current = ''
  let sign = 1

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index]
    if ('([{<'.includes(char)) depth += 1
    if (')]}>'.includes(char)) depth -= 1

    const isOperator = (char === '+' || char === '-') && depth === 0
    if (isOperator) {
      if (current.trim()) terms.push({ sign, text: current.trim() })
      current = ''
      sign = char === '-' ? -1 : 1
      continue
    }

    current += char
  }

  if (current.trim()) terms.push({ sign, text: current.trim() })
  return terms
}

function parseNumber(value) {
  const parsed = Number(value.trim())
  if (!Number.isFinite(parsed)) {
    throw new Error(`"${value}" is not a number.`)
  }
  return parsed
}

function parseLiteralVector(raw) {
  const text = raw.trim()
  const bracketMatch = text.match(/^[([{<]\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*[\])}>]$/)
  if (bracketMatch) {
    return {
      x: parseNumber(bracketMatch[1]),
      y: parseNumber(bracketMatch[2]),
      label: text,
    }
  }

  const compact = text.replace(/\s+/g, '')
  const componentMatch = compact.match(/^([-+]?\d*\.?\d*)i([-+]\d*\.?\d*)j$/)
  if (componentMatch) {
    const x = componentMatch[1] === '' || componentMatch[1] === '+' ? 1 : componentMatch[1] === '-' ? -1 : parseNumber(componentMatch[1])
    const y = componentMatch[2] === '+' ? 1 : componentMatch[2] === '-' ? -1 : parseNumber(componentMatch[2])
    return { x, y, label: text }
  }

  const singleComponentMatch = compact.match(/^([-+]?\d*\.?\d*)([ij])$/)
  if (singleComponentMatch) {
    const valueText = singleComponentMatch[1]
    const value = valueText === '' || valueText === '+' ? 1 : valueText === '-' ? -1 : parseNumber(valueText)
    return singleComponentMatch[2] === 'i'
      ? { x: value, y: 0, label: text }
      : { x: 0, y: value, label: text }
  }

  return null
}

function stripOuterParens(text) {
  const trimmed = text.trim()
  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) return trimmed

  let depth = 0
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index]
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth === 0 && index < trimmed.length - 1) return trimmed
  }

  return trimmed.slice(1, -1).trim()
}

function parseVectorTerm(rawTerm, variables) {
  let term = rawTerm.trim()
  let scalar = 1

  const directLiteral = parseLiteralVector(term)
  if (directLiteral) return directLiteral

  if (variables.has(term)) return variables.get(term)

  term = stripOuterParens(term)

  const groupedTerms = splitExpressionTerms(term)
  if (groupedTerms.length > 1) {
    const vectors = groupedTerms.map(({ sign, text }) => {
      const vector = parseVectorTerm(text, variables)
      return { x: vector.x * sign, y: vector.y * sign }
    })
    const grouped = vectors.reduce((sum, vector) => ({
      x: sum.x + vector.x,
      y: sum.y + vector.y,
    }), { x: 0, y: 0 })
    return { ...grouped, label: rawTerm.trim() }
  }

  const scalarMatch = term.match(/^([-+]?\d*\.?\d+)\s*\*?\s*(.+)$/)
  if (scalarMatch) {
    const candidate = scalarMatch[2].trim()
    if (parseLiteralVector(candidate) || variables.has(candidate) || /^[([{<]/.test(candidate)) {
      scalar = parseNumber(scalarMatch[1])
      term = candidate
    }
  }

  const literal = parseLiteralVector(term)
  const baseVector = literal || variables.get(term)

  if (!baseVector) {
    throw new Error(`Could not read vector "${rawTerm}".`)
  }

  return {
    x: baseVector.x * scalar,
    y: baseVector.y * scalar,
    label: scalar === 1 ? (baseVector.label || term) : `${scalar}(${baseVector.label || term})`,
  }
}

function parseFormula(input) {
  const variables = new Map()
  const statements = splitTopLevel(input.replace(/\n/g, ';'), ';')
  let expression = ''

  statements.forEach((statement) => {
    const assignment = statement.match(/^([a-zA-Z]\w*)\s*=\s*(.+)$/)
    if (assignment) {
      const vector = parseVectorTerm(assignment[2], variables)
      variables.set(assignment[1], { ...vector, label: assignment[1] })
    } else if (statement.trim()) {
      expression = expression ? `${expression} + ${statement}` : statement
    }
  })

  if (!expression) {
    expression = Array.from(variables.keys()).join(' + ')
  }

  const terms = splitExpressionTerms(expression)
  if (!terms.length) throw new Error('Enter at least one vector.')

  const vectors = terms.map(({ sign, text }, index) => {
    const vector = parseVectorTerm(text, variables)
    return {
      ...vector,
      x: vector.x * sign,
      y: vector.y * sign,
      label: `${sign < 0 ? '-' : index === 0 ? '' : '+'}${vector.label}`,
    }
  })

  const result = vectors.reduce((sum, vector) => ({
    x: sum.x + vector.x,
    y: sum.y + vector.y,
  }), { x: 0, y: 0 })

  return { vectors, result, expression, variables }
}

function vectorStats(vector) {
  const magnitude = Math.hypot(vector.x, vector.y)
  const angle = Math.atan2(vector.y, vector.x) * 180 / Math.PI
  return {
    magnitude,
    angle,
  }
}

function drawArrow(ctx, from, to, color, label, width = 3) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const angle = Math.atan2(dy, dx)
  const head = Math.max(8, Math.min(12, width * 4))

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()

  if (label) {
    ctx.font = `${width >= 4 ? 700 : 600} ${Math.max(11, Math.min(14, width * 4))}px Outfit, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(label, (from.x + to.x) / 2, (from.y + to.y) / 2 - 8)
  }
}

function getCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    width: Math.max(280, Math.floor(rect.width || canvas.clientWidth || 640)),
    height: Math.max(260, Math.floor(rect.height || canvas.clientHeight || 420)),
  }
}

function resizeCanvas(canvas) {
  const { width, height } = getCanvasSize(canvas)
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
  const pixelWidth = Math.round(width * dpr)
  const pixelHeight = Math.round(height * dpr)

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }

  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return { width, height }
}

function clearSimulation(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = resizeCanvas(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'rgba(255, 244, 223, 0.72)'
  ctx.fillRect(0, 0, width, height)
}

function drawSimulation(canvas, parsed) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = resizeCanvas(canvas)
  const padding = Math.max(34, Math.min(58, width * 0.08))

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'rgba(255, 244, 223, 0.72)'
  ctx.fillRect(0, 0, width, height)

  const maxComponent = Math.max(
    6,
    ...parsed.vectors.flatMap(vector => [Math.abs(vector.x), Math.abs(vector.y)]),
    Math.abs(parsed.result.x),
    Math.abs(parsed.result.y),
  )
  const scale = Math.max(12, Math.min((width / 2 - padding) / maxComponent, (height / 2 - padding) / maxComponent))
  const origin = { x: width / 2, y: height / 2 }

  ctx.strokeStyle = 'rgba(37, 35, 31, 0.12)'
  ctx.lineWidth = 1
  for (let x = origin.x % scale; x < width; x += scale) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = origin.y % scale; y < height; y += scale) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(37, 35, 31, 0.42)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, origin.y)
  ctx.lineTo(width, origin.y)
  ctx.moveTo(origin.x, 0)
  ctx.lineTo(origin.x, height)
  ctx.stroke()

  const toPoint = vector => ({
    x: origin.x + vector.x * scale,
    y: origin.y - vector.y * scale,
  })

  let tail = { x: 0, y: 0 }
  const colors = ['#2f5d88', '#4c7a3c', '#a9402f', '#9a6e00', '#6d4d8b']

  parsed.vectors.forEach((vector, index) => {
    const head = { x: tail.x + vector.x, y: tail.y + vector.y }
    drawArrow(ctx, toPoint(tail), toPoint(head), colors[index % colors.length], vector.label, width < 420 ? 2.4 : 3)
    tail = head
  })

  ctx.setLineDash([6, 6])
  drawArrow(ctx, origin, toPoint(parsed.result), '#25231f', 'result', width < 420 ? 3.2 : 4)
  ctx.setLineDash([])

  ctx.fillStyle = '#25231f'
  ctx.font = `700 ${width < 420 ? 10 : 12}px Outfit, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`scale: 1 unit = ${round(scale, 1)} px`, 14, height - 16)
}

export function mountVectorAdditionSimulation(container) {
  const root = htmlToElement(`
    <div class="vector-sim sim-inner">
      <section class="vector-workbench">
        <div class="vector-canvas-card">
          <div class="vector-title-row">
            <div>
              <h2>Vector Addition Studio</h2>
              <p>Type a formula and watch the head-to-tail construction redraw instantly.</p>
            </div>
            <span class="vector-chip">2D vectors</span>
          </div>
          <div class="vector-canvas-wrap">
            <canvas class="vector-canvas" aria-label="Vector addition graph"></canvas>
          </div>
        </div>

        <aside class="vector-side">
          <section class="vector-card">
            <h3>Formula</h3>
            <textarea data-formula spellcheck="false">(3, 2) + (2, -1)</textarea>
            <div class="vector-samples"></div>
          </section>

          <section class="vector-card vector-result">
            <h3>Resultant</h3>
            <div class="vector-result-grid">
              <div><span>x</span><strong data-result-x></strong></div>
              <div><span>y</span><strong data-result-y></strong></div>
              <div><span>|R|</span><strong data-result-mag></strong></div>
              <div><span>angle</span><strong data-result-angle></strong></div>
            </div>
          </section>

          <section class="vector-card vector-breakdown">
            <h3>Vector Stack</h3>
            <div data-breakdown></div>
          </section>

          <section class="vector-card vector-note">
            <h3>Accepted Forms</h3>
            <p><code>(x,y)</code>, <code>[x,y]</code>, <code>&lt;x,y&gt;</code>, <code>3i+2j</code>, scalar multiplication, and named vectors.</p>
          </section>
        </aside>
      </section>
    </div>
  `)

  const canvas = root.querySelector('canvas')
  const formulaInput = root.querySelector('[data-formula]')
  const samples = root.querySelector('.vector-samples')
  const resultX = root.querySelector('[data-result-x]')
  const resultY = root.querySelector('[data-result-y]')
  const resultMag = root.querySelector('[data-result-mag]')
  const resultAngle = root.querySelector('[data-result-angle]')
  const breakdown = root.querySelector('[data-breakdown]')
  const listeners = []
  let latestParsed = null
  let resizeObserver = null

  SAMPLE_FORMULAS.forEach((sample, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ctrl-btn-secondary'
    button.dataset.sample = String(index)
    button.textContent = sample
    samples.appendChild(button)
  })

  function renderBreakdown(parsed) {
    breakdown.replaceChildren()
    parsed.vectors.forEach((vector, index) => {
      const stats = vectorStats(vector)
      const row = document.createElement('div')
      row.className = 'vector-row'

      const label = document.createElement('span')
      label.textContent = vector.label || `v${index + 1}`

      const coordinates = document.createElement('strong')
      coordinates.textContent = `(${round(vector.x)}, ${round(vector.y)})`

      const details = document.createElement('em')
      details.textContent = `|v| ${round(stats.magnitude)} · ${round(stats.angle)} deg`

      row.append(label, coordinates, details)
      breakdown.appendChild(row)
    })
  }

  function renderError(message) {
    const error = document.createElement('div')
    error.className = 'vector-error'
    error.textContent = message
    breakdown.replaceChildren(error)
    resultX.textContent = '—'
    resultY.textContent = '—'
    resultMag.textContent = '—'
    resultAngle.textContent = '—'
    latestParsed = null
    clearSimulation(canvas)
  }

  function update() {
    try {
      const parsed = parseFormula(formulaInput.value)
      latestParsed = parsed
      const stats = vectorStats(parsed.result)
      resultX.textContent = String(round(parsed.result.x))
      resultY.textContent = String(round(parsed.result.y))
      resultMag.textContent = String(round(stats.magnitude))
      resultAngle.textContent = `${round(stats.angle)} deg`
      renderBreakdown(parsed)
      drawSimulation(canvas, parsed)
    } catch (error) {
      renderError(error.message)
    }
  }

  function addListener(element, event, handler) {
    element.addEventListener(event, handler)
    listeners.push({ element, event, handler })
  }

  addListener(formulaInput, 'input', update)
  addListener(samples, 'click', (event) => {
    const button = event.target.closest('[data-sample]')
    if (!button) return
    formulaInput.value = SAMPLE_FORMULAS[Number(button.dataset.sample)]
    update()
  })

  container.appendChild(root)
  resizeObserver = new ResizeObserver(() => {
    if (latestParsed) drawSimulation(canvas, latestParsed)
    else clearSimulation(canvas)
  })
  resizeObserver.observe(root.querySelector('.vector-canvas-wrap'))
  update()

  return () => {
    resizeObserver?.disconnect()
    listeners.forEach(({ element, event, handler }) => element.removeEventListener(event, handler))
    if (container.contains(root)) container.removeChild(root)
  }
}
