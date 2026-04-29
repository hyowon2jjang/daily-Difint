import { Link, useLocation } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'

const ADMIN_USERNAMES = import.meta.env.VITE_ADMIN_USERNAMES?.split(',').map((s) => s.trim()) ?? []

export default function Navbar() {
  const location = useLocation()
  const { user, streak } = useUserStore()
  const isAdmin = user && ADMIN_USERNAMES.includes(user.username)

  const navLinks = [
    { to: '/daily', label: 'Daily' },
    { to: '/community', label: 'Community' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ]

  return (
    <nav
      className="sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Logo */}
      <Link to="/" className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
        daily<span style={{ color: 'var(--color-text)' }}>Difint</span>
      </Link>

      {/* Center nav links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-sm font-medium transition-colors"
            style={{
              color: location.pathname === to ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Streak badge */}
            <span
              className="flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-streak)' }}
            >
              🔥 {streak}
            </span>

            {/* Admin link */}
            {isAdmin && (
              <Link to="/admin" className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ backgroundColor: 'var(--color-medium)22', color: 'var(--color-medium)' }}>
                Admin
              </Link>
            )}

            {/* Avatar */}
            <Link
              to={`/profile/${user.username}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </Link>

          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
