import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function KaTeX({ math, display = false, className = '' }) {
  const root = document.createElement('span')
  root.className = `katex-elem ${className}`.trim()

  katex.render(math, root, {
    displayMode: display,
    throwOnError: false,
    output: 'html',
  })

  return root
}

export function mountKaTeX(container, math, display = false, className = '') {
  const root = KaTeX({ math, display, className })
  container.appendChild(root)
  return () => {
    if (container.contains(root)) {
      container.removeChild(root)
    }
  }
}
