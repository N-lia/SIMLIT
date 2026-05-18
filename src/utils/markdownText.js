function appendInline(parent, text) {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) {
      parent.append(document.createTextNode(text.slice(lastIndex, match.index)))
    }

    const token = match[0]
    if (token.startsWith('`')) {
      const code = document.createElement('code')
      code.textContent = token.slice(1, -1)
      parent.append(code)
    } else if (token.startsWith('**')) {
      const strong = document.createElement('strong')
      strong.textContent = token.slice(2, -2)
      parent.append(strong)
    } else if (token.startsWith('*')) {
      const emphasis = document.createElement('em')
      emphasis.textContent = token.slice(1, -1)
      parent.append(emphasis)
    } else {
      const closeLabel = token.indexOf(']')
      const label = token.slice(1, closeLabel)
      const url = token.slice(closeLabel + 2, -1)
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.textContent = label
      parent.append(link)
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parent.append(document.createTextNode(text.slice(lastIndex)))
  }
}

function appendParagraph(container, text) {
  if (!text.trim()) return
  const paragraph = document.createElement('p')
  appendInline(paragraph, text.trim())
  container.append(paragraph)
}

function appendList(container, items, ordered = false) {
  if (!items.length) return
  const list = document.createElement(ordered ? 'ol' : 'ul')
  items.forEach((item) => {
    const listItem = document.createElement('li')
    appendInline(listItem, item)
    list.append(listItem)
  })
  container.append(list)
}

export function renderMarkdownText(container, markdown = '') {
  container.textContent = ''

  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  let paragraph = []
  let unorderedItems = []
  let orderedItems = []
  let codeLines = []
  let inCodeBlock = false

  const flushParagraph = () => {
    appendParagraph(container, paragraph.join(' '))
    paragraph = []
  }

  const flushLists = () => {
    appendList(container, unorderedItems, false)
    appendList(container, orderedItems, true)
    unorderedItems = []
    orderedItems = []
  }

  const flushOpenBlocks = () => {
    flushParagraph()
    flushLists()
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        const pre = document.createElement('pre')
        const code = document.createElement('code')
        code.textContent = codeLines.join('\n')
        pre.append(code)
        container.append(pre)
        codeLines = []
        inCodeBlock = false
      } else {
        flushOpenBlocks()
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeLines.push(rawLine)
      return
    }

    if (!trimmed) {
      flushOpenBlocks()
      return
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushOpenBlocks()
      const level = Math.min(heading[1].length + 3, 6)
      const title = document.createElement(`h${level}`)
      appendInline(title, heading[2])
      container.append(title)
      return
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/)
    if (unordered) {
      flushParagraph()
      appendList(container, orderedItems, true)
      orderedItems = []
      unorderedItems.push(unordered[1])
      return
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (ordered) {
      flushParagraph()
      appendList(container, unorderedItems, false)
      unorderedItems = []
      orderedItems.push(ordered[1])
      return
    }

    const quote = trimmed.match(/^>\s+(.+)$/)
    if (quote) {
      flushOpenBlocks()
      const blockquote = document.createElement('blockquote')
      appendInline(blockquote, quote[1])
      container.append(blockquote)
      return
    }

    flushLists()
    paragraph.push(trimmed)
  })

  if (inCodeBlock && codeLines.length) {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.textContent = codeLines.join('\n')
    pre.append(code)
    container.append(pre)
  }

  flushOpenBlocks()
}
