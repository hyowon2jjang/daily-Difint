import { useState } from 'react'
import MathDisplay from '../MathDisplay/MathDisplay'

const SECTIONS = [
  {
    title: 'Powers & Roots',
    items: [
      { label: 'Fraction',      latex: '\\frac{a}{b}',        code: '\\frac{a}{b}' },
      { label: 'Power',         latex: 'x^{n}',               code: 'x^{n}' },
      { label: 'Square root',   latex: '\\sqrt{x}',           code: '\\sqrt{x}' },
      { label: 'nth root',      latex: '\\sqrt[n]{x}',        code: '\\sqrt[n]{x}' },
      { label: 'x^{n+1}/n+1',  latex: '\\frac{x^{n+1}}{n+1}', code: '\\frac{x^{n+1}}{n+1}' },
    ],
  },
  {
    title: 'Trig',
    items: [
      { label: 'sin',    latex: '\\sin(x)',     code: '\\sin(x)' },
      { label: 'cos',    latex: '\\cos(x)',     code: '\\cos(x)' },
      { label: 'tan',    latex: '\\tan(x)',     code: '\\tan(x)' },
      { label: 'sec',    latex: '\\sec(x)',     code: '\\sec(x)' },
      { label: 'arcsin', latex: '\\arcsin(x)', code: '\\arcsin(x)' },
      { label: 'arctan', latex: '\\arctan(x)', code: '\\arctan(x)' },
      { label: 'sin²',   latex: '\\sin^2(x)',  code: '\\sin^2(x)' },
      { label: 'cos²',   latex: '\\cos^2(x)',  code: '\\cos^2(x)' },
    ],
  },
  {
    title: 'Exp & Log',
    items: [
      { label: 'e^x',     latex: 'e^{x}',          code: 'e^{x}' },
      { label: 'e^{f(x)}',latex: 'e^{x^2}',        code: 'e^{x^2}' },
      { label: 'ln',      latex: '\\ln(x)',          code: '\\ln(x)' },
      { label: 'log base',latex: '\\log_{a}(x)',    code: '\\log_{a}(x)' },
      { label: '|x|',     latex: '\\ln|x|',         code: '\\ln|x|' },
    ],
  },
  {
    title: 'Calculus',
    items: [
      { label: 'Integral',       latex: '\\int f(x)\\,dx',          code: '\\int f(x)\\,dx' },
      { label: 'Def. integral',  latex: '\\int_a^b f(x)\\,dx',      code: '\\int_a^b f(x)\\,dx' },
      { label: 'Derivative',     latex: '\\frac{d}{dx}',             code: '\\frac{d}{dx}' },
      { label: "f'(x)",          latex: 'f\'(x)',                    code: "f'(x)" },
      { label: 'Partial',        latex: '\\frac{\\partial f}{\\partial x}', code: '\\frac{\\partial f}{\\partial x}' },
      { label: 'Limit',          latex: '\\lim_{x \\to 0}',         code: '\\lim_{x \\to 0}' },
    ],
  },
  {
    title: 'Greek Letters',
    items: [
      { label: 'pi',     latex: '\\pi',      code: '\\pi' },
      { label: 'theta',  latex: '\\theta',   code: '\\theta' },
      { label: 'alpha',  latex: '\\alpha',   code: '\\alpha' },
      { label: 'beta',   latex: '\\beta',    code: '\\beta' },
      { label: 'omega',  latex: '\\omega',   code: '\\omega' },
      { label: 'infty',  latex: '\\infty',   code: '\\infty' },
    ],
  },
]

export default function LatexCheatSheet() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(null)

  function handleCopy(code) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div
      className="rounded-2xl border mt-4 overflow-hidden"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            LaTeX Cheat Sheet
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
            click to copy
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="p-4 grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {SECTIONS.map((section) => (
              <div key={section.title}>
                {/* Section title */}
                <p className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-primary)' }}>
                  {section.title}
                </p>

                {/* Items */}
                <div className="flex flex-col gap-1">
                  {section.items.map(({ label, latex, code }) => {
                    const isCopied = copied === code
                    return (
                      <button
                        key={code}
                        onClick={() => handleCopy(code)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left w-full group"
                        style={{
                          backgroundColor: isCopied
                            ? 'var(--color-easy)18'
                            : 'var(--color-surface-2)',
                          border: `1px solid ${isCopied ? 'var(--color-easy)' : 'transparent'}`,
                          transition: 'background-color 0.15s, border-color 0.15s',
                        }}
                      >
                        {/* Rendered math */}
                        <span className="shrink-0 min-w-[48px] text-center">
                          <MathDisplay latex={latex} />
                        </span>

                        {/* Divider */}
                        <span style={{ color: 'var(--color-border)', fontSize: '0.6rem' }}>│</span>

                        {/* Code / copied feedback */}
                        <span className="text-xs font-mono truncate"
                          style={{ color: isCopied ? 'var(--color-easy)' : 'var(--color-text-muted)' }}>
                          {isCopied ? '✓ copied' : code}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <p className="text-xs text-center pb-3" style={{ color: 'var(--color-text-muted)' }}>
            Tap any row to copy the LaTeX code
          </p>
        </div>
      )}
    </div>
  )
}
