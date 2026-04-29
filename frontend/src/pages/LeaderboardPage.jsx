import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/leaderboard', { params: { period } })
      .then((res) => setEntries(res.data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-5">Leaderboard</h1>

      {/* Period toggle */}
      <div
        className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {['weekly', 'monthly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all"
            style={{
              backgroundColor: period === p ? 'var(--color-primary)' : 'transparent',
              color: period === p ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <Link
              key={entry.username}
              to={`/profile/${entry.username}`}
              className="flex items-center gap-4 rounded-xl px-4 py-3 border transition-opacity hover:opacity-80"
              style={{
                backgroundColor: i < 3 ? 'var(--color-surface)' : 'transparent',
                borderColor: i < 3 ? 'var(--color-border)' : 'transparent',
              }}
            >
              <span className="w-6 text-center text-sm font-bold">
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {entry.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="flex-1 text-sm font-medium">@{entry.username}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {entry.xp_this_period} XP
              </span>
              <span className="text-xs" style={{ color: 'var(--color-streak)' }}>
                🔥{entry.streak}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
