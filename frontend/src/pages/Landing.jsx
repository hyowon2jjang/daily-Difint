import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-8">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">
          daily<span style={{ color: 'var(--color-primary)' }}>Difint</span>
        </h1>
        <p className="text-lg max-w-md" style={{ color: 'var(--color-text-muted)' }}>
          Sharpen your calculus. One integral, one ODE, every day.
          Build your streak. Beat the Boss on weekends.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/daily"
          className="px-8 py-3 rounded-xl font-bold text-base"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          Solve Today's Problems
        </Link>
        <Link
          to="/signup"
          className="px-8 py-3 rounded-xl font-bold text-base border"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          Create Account
        </Link>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4">
        {[
          { icon: '🔥', title: 'Daily Streaks', desc: 'Complete 2 Easy + 1 Medium to keep your streak alive.' },
          { icon: '👾', title: 'Weekend Boss', desc: 'A harder multi-step problem drops every Saturday and Sunday.' },
          { icon: '🤝', title: 'Community', desc: 'Discover and discuss interesting problems with other solvers.' },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border p-5 text-left"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
