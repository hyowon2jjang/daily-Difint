// Shows Wordle-style attempt dots: filled = used, empty = remaining
export default function AttemptTracker({ max, used, correct }) {
  if (max === null) return (
    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Unlimited attempts</p>
  )

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => {
        let color = 'var(--color-border)'
        if (correct && i === used - 1) color = 'var(--color-easy)' // last dot = correct
        else if (i < used) color = 'var(--color-boss)'             // all used dots = wrong

        return (
          <span
            key={i}
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: color }}
          />
        )
      })}
      <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
        {used}/{max} attempts
      </span>
    </div>
  )
}
