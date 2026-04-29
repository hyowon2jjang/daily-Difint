import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

const DOT_COLORS = ['var(--color-boss)', 'var(--color-medium)', 'var(--color-easy)']

// Calendar cell colors: 0=empty, 1=partial, 2=partial+, 3=full, 4=boss
const CALENDAR_COLORS = [
  'var(--color-surface-2)',  // 0 none
  '#166534',                 // 1 partial (1 easy)
  '#16a34a',                 // 2 partial (2 easy)
  'var(--color-easy)',       // 3 full required
  'var(--color-streak)',     // 4 boss
]

function StrengthDots({ score }) {
  const level = score >= 70 ? 3 : score >= 40 ? 2 : 1
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((d) => (
        <span
          key={d}
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: d <= level ? DOT_COLORS[level - 1] : 'var(--color-border)' }}
        />
      ))}
    </span>
  )
}

function XPBarChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data.map((d) => d.xp), 1)
  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h2 className="text-sm font-semibold mb-4">XP — Last 7 Days</h2>
      <div className="flex items-end gap-2 h-20">
        {data.map(({ date, xp }) => {
          const heightPct = max > 0 ? (xp / max) * 100 : 0
          const label = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-primary)', minHeight: '1rem' }}>
                {xp > 0 ? xp : ''}
              </span>
              <div className="w-full rounded-t-md transition-all" style={{
                height: `${Math.max(heightPct, xp > 0 ? 8 : 2)}%`,
                minHeight: xp > 0 ? '6px' : '2px',
                backgroundColor: xp > 0 ? 'var(--color-primary)' : 'var(--color-border)',
              }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SolveCalendar({ calendar }) {
  if (!calendar) return null

  // Build a 26-week grid (6 months) ending today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the Sunday 26 weeks ago
  const start = new Date(today)
  start.setDate(start.getDate() - 26 * 7 + 1)
  // Rewind to Sunday
  start.setDate(start.getDate() - start.getDay())

  const weeks = []
  const cursor = new Date(start)
  while (cursor <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split('T')[0]
      const isFuture = cursor > today
      week.push({ dateStr, level: isFuture ? -1 : (calendar[dateStr] ?? 0) })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  // Month labels
  const monthLabels = []
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0].dateStr + 'T00:00:00')
    if (firstDay.getDate() <= 7) {
      monthLabels.push({ wi, label: firstDay.toLocaleDateString('en-US', { month: 'short' }) })
    }
  })

  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h2 className="text-sm font-semibold mb-3">Solve History</h2>
      <div className="overflow-x-auto">
        <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: '16px', marginBottom: '4px' }}>
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.wi === wi)
              return (
                <div key={wi} style={{ width: '12px', marginRight: '2px', fontSize: '9px',
                  color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {label?.label ?? ''}
                </div>
              )
            })}
          </div>

          {/* Day rows (0=Sun … 6=Sat) */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} style={{ width: '10px', height: '10px', fontSize: '8px',
                  color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {week.map(({ dateStr, level }) => (
                  <div
                    key={dateStr}
                    title={level >= 0 ? `${dateStr}${level > 0 ? ` · level ${level}` : ''}` : ''}
                    style={{
                      width: '10px', height: '10px', borderRadius: '2px',
                      backgroundColor: level < 0 ? 'transparent' : CALENDAR_COLORS[level],
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2" style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
            <span>Less</span>
            {CALENDAR_COLORS.map((c, i) => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: c }} />
            ))}
            <span>More</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-streak)' }} />
            <span>Boss</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useUserStore()
  const isOwnProfile = user?.username === username
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  function handleLogout() {
    logout()
    navigate('/')
  }

  useEffect(() => {
    api.get(`/profile/${username}`)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return (
    <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
  )
  if (!profile) return (
    <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>User not found.</div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">@{username}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Level {profile.level} · {profile.xp} XP
          </p>
          <p className="text-sm" style={{ color: 'var(--color-streak)' }}>
            🔥 Streak: {profile.streak} days
          </p>
          {/* XP progress bar to next level */}
          <div className="mt-1.5">
            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${profile.level_pct}%`, backgroundColor: 'var(--color-primary)' }}
              />
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {profile.level_pct}% to Level {profile.level + 1} ({profile.xp_for_next} XP)
            </p>
          </div>
        </div>
      </div>

      {/* XP Bar Chart */}
      <XPBarChart data={profile.xp_last_7_days} />

      {/* Solve Calendar */}
      <SolveCalendar calendar={profile.calendar} />

      {/* Friend code */}
      <div
        className="rounded-xl border px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Friend Code</p>
          <p className="font-mono font-bold tracking-widest">{profile.friend_code}</p>
        </div>
        <button
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
          onClick={() => navigator.clipboard.writeText(profile.friend_code)}
        >
          Copy
        </button>
      </div>

      {/* Stats */}
      <div
        className="rounded-xl border px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total solved</p>
          <p className="text-lg font-bold">{profile.stats?.total_solved ?? 0}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Accuracy</p>
          <p className="text-lg font-bold">{profile.stats?.accuracy ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Boss solves</p>
          <p className="text-lg font-bold">{profile.stats?.boss_solved ?? 0}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Favorite tag</p>
          <p className="text-sm font-semibold truncate">{profile.stats?.favorite_tag ?? '—'}</p>
        </div>
      </div>

      {/* Weakness radar */}
      {profile.topic_stats?.length > 0 && (
        <div
          className="rounded-xl border px-4 py-4"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold mb-3">Technique Strength</h2>
          <div className="flex flex-col gap-2.5">
            {profile.topic_stats.map(({ tag, score }) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tag}</span>
                <StrengthDots score={score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div
          className="rounded-xl border px-4 py-4"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge) => (
              <span
                key={badge.id}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                title={badge.description}
                style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-primary)' }}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      {isOwnProfile && (
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm font-semibold mt-2"
          style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-boss)' }}
        >
          Log out
        </button>
      )}
    </div>
  )
}
