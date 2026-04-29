import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathDisplay({ latex, block = false, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && latex) {
      ref.current.innerHTML = ''
      try {
        katex.render(latex, ref.current, {
          displayMode: block,
          throwOnError: false,
          trust: false,
        })
      } catch {
        ref.current.textContent = latex
      }
    }
  }, [latex, block])

  return <span ref={ref} className={className} />
}
