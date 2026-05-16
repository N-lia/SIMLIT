import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function KaTeX({ math, display = false, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current)
      katex.render(math, ref.current, { displayMode: display, throwOnError: false, output: 'html' })
  }, [math, display])
  return <span ref={ref} className={`katex-elem ${className}`} />
}
