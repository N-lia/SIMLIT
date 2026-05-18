import { htmlToElement } from '../../utils/dom.js'
import './NandFlashSimulation.css'

const BLOCK_COUNT = 4
const PAGES_PER_BLOCK = 4
const WEAR_LIMIT = 10

function clampIndex(value, max) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return 0
  return Math.min(Math.max(parsed, 0), max - 1)
}

function createFlash() {
  return Array.from({ length: BLOCK_COUNT }, (_, blockId) => ({
    blockId,
    eraseCount: 0,
    worn: false,
    pages: Array.from({ length: PAGES_PER_BLOCK }, () => ({
      data: null,
      state: 'empty',
    })),
  }))
}

export function mountNandFlashSimulation(container) {
  let flash = createFlash()
  let totalWrites = 0
  let totalErases = 0
  let selectedBlock = 0
  let selectedPage = 0

  const root = htmlToElement(`
    <div class="nand-sim sim-inner">
      <section class="nand-workbench">
        <div class="nand-main-panel">
          <div class="nand-title-row">
            <div>
              <h2>NAND Flash Simulator</h2>
              <p>Explore pages, blocks, erase cycles, and the write-before-erase constraint.</p>
            </div>
            <span class="nand-chip">Raw flash behavior</span>
          </div>

          <div class="nand-stats" aria-label="Flash memory statistics">
            <div class="nand-stat"><span>Blocks</span><strong data-block-count></strong></div>
            <div class="nand-stat"><span>Pages/block</span><strong data-pages-count></strong></div>
            <div class="nand-stat"><span>Total writes</span><strong data-total-writes></strong></div>
            <div class="nand-stat"><span>Total erases</span><strong data-total-erases></strong></div>
            <div class="nand-stat"><span>Max wear</span><strong data-max-wear></strong></div>
          </div>

          <div class="nand-grid-panel">
            <div class="nand-grid" data-flash-grid></div>
          </div>

          <div class="nand-legend" aria-label="Page state legend">
            <span><i class="legend-empty"></i>Empty</span>
            <span><i class="legend-written"></i>Written</span>
            <span><i class="legend-erased"></i>Erased</span>
            <span><i class="legend-worn"></i>Worn block</span>
          </div>
        </div>

        <aside class="nand-side-panel">
          <section class="nand-card nand-controls">
            <h3>Flash Commands</h3>
            <label class="nand-field">
              <span>Data</span>
              <input data-write-data type="text" maxlength="8" value="OS" aria-label="Data to write" />
            </label>

            <div class="nand-pickers">
              <label class="nand-field">
                <span>Block</span>
                <input data-block-select type="number" min="0" max="3" value="0" aria-label="Selected block" />
              </label>
              <label class="nand-field">
                <span>Page</span>
                <input data-page-select type="number" min="0" max="3" value="0" aria-label="Selected page" />
              </label>
            </div>

            <div class="nand-button-grid">
              <button class="ctrl-btn-primary" data-write-page>Write Page</button>
              <button class="ctrl-btn-secondary" data-read-page>Read Page</button>
              <button class="ctrl-btn-secondary" data-erase-block>Erase Block</button>
              <button class="ctrl-btn-secondary" data-wear-level>Wear Hint</button>
              <button class="ctrl-btn-secondary nand-reset" data-reset-flash>Factory Reset</button>
            </div>
          </section>

          <section class="nand-card nand-notebook">
            <h3>NAND Notes</h3>
            <ul>
              <li><strong>Page:</strong> smallest read/write unit.</li>
              <li><strong>Block:</strong> smallest erase unit.</li>
              <li><strong>Write rule:</strong> written pages cannot be overwritten until the whole block is erased.</li>
              <li><strong>Wear:</strong> each erase moves a block closer to failure.</li>
            </ul>
            <p>Real SSDs hide this raw behavior behind a Flash Translation Layer and wear leveling.</p>
          </section>

          <section class="nand-card nand-console" aria-live="polite">
            <h3>Event Log</h3>
            <div data-flash-message></div>
          </section>
        </aside>
      </section>
    </div>
  `)

  const grid = root.querySelector('[data-flash-grid]')
  const blockCount = root.querySelector('[data-block-count]')
  const pagesCount = root.querySelector('[data-pages-count]')
  const totalWritesEl = root.querySelector('[data-total-writes]')
  const totalErasesEl = root.querySelector('[data-total-erases]')
  const maxWearEl = root.querySelector('[data-max-wear]')
  const writeData = root.querySelector('[data-write-data]')
  const blockSelect = root.querySelector('[data-block-select]')
  const pageSelect = root.querySelector('[data-page-select]')
  const log = root.querySelector('[data-flash-message]')

  const listeners = []

  function updateStats() {
    blockCount.textContent = String(BLOCK_COUNT)
    pagesCount.textContent = String(PAGES_PER_BLOCK)
    totalWritesEl.textContent = String(totalWrites)
    totalErasesEl.textContent = String(totalErases)
    maxWearEl.textContent = String(Math.max(...flash.map(block => block.eraseCount)))
  }

  function syncSelection(blockIdx = selectedBlock, pageIdx = selectedPage) {
    selectedBlock = clampIndex(blockIdx, BLOCK_COUNT)
    selectedPage = clampIndex(pageIdx, PAGES_PER_BLOCK)
    blockSelect.value = String(selectedBlock)
    pageSelect.value = String(selectedPage)
    renderGrid()
  }

  function addMessage(message, tone = 'note') {
    const entry = document.createElement('div')
    entry.className = `nand-log-entry ${tone === 'error' ? 'is-error' : ''}`
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    entry.textContent = `[${time}] ${message}`
    log.prepend(entry)
    while (log.children.length > 8) log.removeChild(log.lastChild)
  }

  function canWrite(blockIdx, pageIdx) {
    const block = flash[blockIdx]
    const page = block?.pages[pageIdx]
    return Boolean(block && page && !block.worn && (page.state === 'empty' || page.state === 'erased'))
  }

  function writePage() {
    const blockIdx = clampIndex(blockSelect.value, BLOCK_COUNT)
    const pageIdx = clampIndex(pageSelect.value, PAGES_PER_BLOCK)
    const block = flash[blockIdx]
    const data = writeData.value.trim() || 'DATA'

    syncSelection(blockIdx, pageIdx)

    if (block.worn) {
      addMessage(`Block ${blockIdx} is worn out and cannot accept writes.`, 'error')
      return
    }

    if (!canWrite(blockIdx, pageIdx)) {
      addMessage(`Page ${pageIdx} in block ${blockIdx} is already written. Erase the block first.`, 'error')
      return
    }

    block.pages[pageIdx] = { data, state: 'written' }
    totalWrites += 1
    updateStats()
    renderGrid()
    addMessage(`Wrote "${data}" to block ${blockIdx}, page ${pageIdx}.`)
  }

  function eraseBlock(blockIdx = blockSelect.value) {
    const normalizedBlock = clampIndex(blockIdx, BLOCK_COUNT)
    const block = flash[normalizedBlock]
    syncSelection(normalizedBlock, selectedPage)

    if (block.worn) {
      addMessage(`Block ${normalizedBlock} is already worn and cannot be erased.`, 'error')
      return
    }

    block.pages = block.pages.map(() => ({ data: null, state: 'erased' }))
    block.eraseCount += 1
    totalErases += 1

    if (block.eraseCount >= WEAR_LIMIT) {
      block.worn = true
      addMessage(`Block ${normalizedBlock} reached ${WEAR_LIMIT} erase cycles and is now worn.`, 'error')
    } else {
      addMessage(`Erased block ${normalizedBlock}. Wear is ${block.eraseCount}/${WEAR_LIMIT}.`)
    }

    updateStats()
    renderGrid()
  }

  function readPage() {
    const blockIdx = clampIndex(blockSelect.value, BLOCK_COUNT)
    const pageIdx = clampIndex(pageSelect.value, PAGES_PER_BLOCK)
    const page = flash[blockIdx].pages[pageIdx]
    syncSelection(blockIdx, pageIdx)

    if (page.state === 'written') {
      addMessage(`Read block ${blockIdx}, page ${pageIdx}: "${page.data}".`)
    } else if (page.state === 'erased') {
      addMessage(`Block ${blockIdx}, page ${pageIdx} is erased and ready for writing.`)
    } else {
      addMessage(`Block ${blockIdx}, page ${pageIdx} is empty.`)
    }
  }

  function wearLevelingInsight() {
    const candidates = flash
      .filter(block => !block.worn)
      .reduce((acc, block) => {
        if (!acc.length || block.eraseCount < acc[0].eraseCount) return [block]
        if (block.eraseCount === acc[0].eraseCount) return [...acc, block]
        return acc
      }, [])

    if (!candidates.length) {
      addMessage('All blocks are worn, so there is no healthy block to remap writes to.', 'error')
      return
    }

    addMessage(`Wear leveling would prefer block(s) ${candidates.map(block => block.blockId).join(', ')} at ${candidates[0].eraseCount} erase cycles.`)
  }

  function factoryReset() {
    flash = createFlash()
    totalWrites = 0
    totalErases = 0
    selectedBlock = 0
    selectedPage = 0
    syncSelection(0, 0)
    updateStats()
    addMessage('Factory reset complete. All pages are empty and wear counters are fresh.')
  }

  function renderGrid() {
    grid.innerHTML = ''

    flash.forEach((block, blockIdx) => {
      const blockEl = document.createElement('article')
      blockEl.className = `nand-block ${block.worn ? 'is-worn' : ''}`

      const header = document.createElement('button')
      header.className = 'nand-block-header'
      header.type = 'button'
      header.innerHTML = `
        <span>Block ${blockIdx}</span>
        <strong>${block.worn ? 'Worn' : `${block.eraseCount}/${WEAR_LIMIT}`} cycles</strong>
      `

      const pages = document.createElement('div')
      pages.className = 'nand-pages'

      block.pages.forEach((page, pageIdx) => {
        const pageButton = document.createElement('button')
        pageButton.type = 'button'
        pageButton.className = `nand-page is-${page.state} ${selectedBlock === blockIdx && selectedPage === pageIdx ? 'is-selected' : ''}`
        pageButton.dataset.block = String(blockIdx)
        pageButton.dataset.page = String(pageIdx)

        const label = document.createElement('span')
        label.className = 'nand-page-label'
        label.textContent = `Page ${pageIdx}`

        const value = document.createElement('strong')
        value.textContent = page.state === 'written' ? page.data : page.state

        pageButton.append(label, value)
        pages.appendChild(pageButton)
      })

      blockEl.append(header, pages)
      grid.appendChild(blockEl)
    })
  }

  function addListener(element, event, handler) {
    element.addEventListener(event, handler)
    listeners.push({ element, event, handler })
  }

  addListener(root.querySelector('[data-write-page]'), 'click', writePage)
  addListener(root.querySelector('[data-read-page]'), 'click', readPage)
  addListener(root.querySelector('[data-erase-block]'), 'click', () => eraseBlock())
  addListener(root.querySelector('[data-wear-level]'), 'click', wearLevelingInsight)
  addListener(root.querySelector('[data-reset-flash]'), 'click', factoryReset)
  addListener(blockSelect, 'change', () => syncSelection(blockSelect.value, selectedPage))
  addListener(pageSelect, 'change', () => syncSelection(selectedBlock, pageSelect.value))
  addListener(grid, 'click', (event) => {
    const pageButton = event.target.closest('.nand-page')
    const blockHeader = event.target.closest('.nand-block-header')

    if (pageButton) {
      syncSelection(pageButton.dataset.block, pageButton.dataset.page)
      readPage()
      return
    }

    if (blockHeader) {
      const blockEl = blockHeader.closest('.nand-block')
      const blockIdx = Array.from(grid.children).indexOf(blockEl)
      eraseBlock(blockIdx)
    }
  })

  container.appendChild(root)
  updateStats()
  renderGrid()
  addMessage('NAND flash simulator ready. Click any page to inspect it.')

  return () => {
    listeners.forEach(({ element, event, handler }) => element.removeEventListener(event, handler))
    if (container.contains(root)) container.removeChild(root)
  }
}
