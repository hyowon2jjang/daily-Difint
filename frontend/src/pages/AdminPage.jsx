import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MathDisplay from '../components/MathDisplay/MathDisplay'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

const DIFFICULTIES = ['easy', 'medium', 'boss']
const ALL_TAGS = [
  'u-substitution', 'integration-by-parts', 'trig-substitution',
  'partial-fractions', 'trig-integrals', 'improper-integrals',
  'feynman-technique', 'separable-ode', 'linear-first-order',
  'exact-equations', 'second-order-linear', 'laplace-transform',
]
const DIFF_COLORS = {
  easy: 'var(--color-easy)',
  medium: 'var(--color-medium)',
  boss: 'var(--color-boss)',
}

// ── Create Problem Form ──────────────────────────────────────
function CreateProblem({ onCreated }) {
  const [form, setForm] = useState({
    title: '', body_latex: '', answer_latex: '',
    difficulty: 'easy', technique_tags: [],
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      technique_tags: f.technique_tags.includes(tag)
        ? f.technique_tags.filter((t) => t !== tag)
        : [...f.technique_tags, tag],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.body_latex.trim() || !form.answer_latex.trim()) {
      setMsg({ type: 'error', text: 'Problem and answer are required.' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      const res = await api.post('/admin/problems', form)
      setMsg({ type: 'ok', text: `Created: "${res.data.title}" (ID: ${res.data.id})` })
      setForm({ title: '', body_latex: '', answer_latex: '', difficulty: 'easy', technique_tags: [] })
      onCreated()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Title</label>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Basic Power Rule"
          className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
          style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
      </div>

      {/* Problem LaTeX */}
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Problem (LaTeX)</label>
        <textarea value={form.body_latex} onChange={(e) => setForm((f) => ({ ...f, body_latex: e.target.value }))}
          placeholder={`\\int x^2 \\, dx`} rows={3}
          className="w-full px-3 py-2 rounded-xl border text-sm font-mono outline-none resize-none"
          style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
        {form.body_latex && (
          <div className="mt-2 px-3 py-3 rounded-xl text-center" style={{ backgroundColor: 'var(--color-surface-2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Preview</p>
            <MathDisplay latex={form.body_latex} block />
          </div>
        )}
      </div>

      {/* Answer LaTeX */}
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Answer (LaTeX)</label>
        <input value={form.answer_latex} onChange={(e) => setForm((f) => ({ ...f, answer_latex: e.target.value }))}
          placeholder={`\\frac{x^3}{3}`}
          className="w-full px-3 py-2 rounded-xl border text-sm font-mono outline-none"
          style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
        {form.answer_latex && (
          <div className="mt-2 px-3 py-2 rounded-xl text-center" style={{ backgroundColor: 'var(--color-surface-2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Preview</p>
            <MathDisplay latex={form.answer_latex} block />
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div>
        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d} type="button" onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
              className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize border"
              style={{
                backgroundColor: form.difficulty === d ? DIFF_COLORS[d] + '22' : 'var(--color-surface-2)',
                borderColor: form.difficulty === d ? DIFF_COLORS[d] : 'var(--color-border)',
                color: form.difficulty === d ? DIFF_COLORS[d] : 'var(--color-text-muted)',
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>Technique Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className="text-xs px-3 py-1 rounded-full border"
              style={{
                backgroundColor: form.technique_tags.includes(tag) ? 'var(--color-primary)22' : 'var(--color-surface-2)',
                borderColor: form.technique_tags.includes(tag) ? 'var(--color-primary)' : 'var(--color-border)',
                color: form.technique_tags.includes(tag) ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <p className="text-sm" style={{ color: msg.type === 'ok' ? 'var(--color-easy)' : 'var(--color-boss)' }}>
          {msg.text}
        </p>
      )}

      <button type="submit" disabled={loading}
        className="py-3 rounded-xl text-sm font-bold"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Saving...' : 'Save Problem'}
      </button>
    </form>
  )
}

// ── Schedule Day Form ────────────────────────────────────────
function ScheduleDay({ problems, schedule, onScheduled }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState({ easy1: '', easy2: '', medium: '', boss: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const easyProblems = problems.filter((p) => p.difficulty === 'easy')
  const mediumProblems = problems.filter((p) => p.difficulty === 'medium')
  const bossProblems = problems.filter((p) => p.difficulty === 'boss')

  const scheduledDates = new Set(schedule.map((s) => s.date))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!slots.easy1 || !slots.easy2 || !slots.medium) {
      setMsg({ type: 'error', text: 'Easy 1, Easy 2, and Medium are required.' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      await api.post('/admin/schedule', {
        date,
        easy1_id: slots.easy1,
        easy2_id: slots.easy2,
        medium_id: slots.medium,
        boss_id: slots.boss || null,
      })
      setMsg({ type: 'ok', text: `Scheduled for ${date}!` })
      setSlots({ easy1: '', easy2: '', medium: '', boss: '' })
      onScheduled()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed.' })
    } finally {
      setLoading(false)
    }
  }

  function ProblemSelect({ label, value, onChange, options }) {
    return (
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
          style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
          <option value="">— Select —</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>{p.title || p.body_latex.slice(0, 40)}</option>
          ))}
        </select>
        {value && (() => {
          const p = options.find((x) => x.id === value)
          return p ? (
            <div className="mt-1 px-3 py-2 rounded-xl text-center" style={{ backgroundColor: 'var(--color-surface-2)' }}>
              <MathDisplay latex={p.body_latex} block />
            </div>
          ) : null
        })()}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Date picker */}
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm outline-none"
          style={{
            backgroundColor: scheduledDates.has(date) ? 'var(--color-boss)22' : 'var(--color-surface-2)',
            borderColor: scheduledDates.has(date) ? 'var(--color-boss)' : 'var(--color-border)',
            color: 'var(--color-text)',
          }} />
        {scheduledDates.has(date) && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-boss)' }}>
            This date already has a schedule. Delete it first to replace.
          </p>
        )}
      </div>

      <ProblemSelect label="Easy 1" value={slots.easy1}
        onChange={(v) => setSlots((s) => ({ ...s, easy1: v }))} options={easyProblems} />
      <ProblemSelect label="Easy 2" value={slots.easy2}
        onChange={(v) => setSlots((s) => ({ ...s, easy2: v }))} options={easyProblems} />
      <ProblemSelect label="Medium" value={slots.medium}
        onChange={(v) => setSlots((s) => ({ ...s, medium: v }))} options={mediumProblems} />
      <ProblemSelect label="Boss (optional — shown on weekends)" value={slots.boss}
        onChange={(v) => setSlots((s) => ({ ...s, boss: v }))} options={bossProblems} />

      {msg && (
        <p className="text-sm" style={{ color: msg.type === 'ok' ? 'var(--color-easy)' : 'var(--color-boss)' }}>
          {msg.text}
        </p>
      )}

      <button type="submit" disabled={loading || scheduledDates.has(date)}
        className="py-3 rounded-xl text-sm font-bold"
        style={{
          backgroundColor: 'var(--color-primary)', color: '#fff',
          opacity: loading || scheduledDates.has(date) ? 0.5 : 1,
        }}>
        {loading ? 'Scheduling...' : 'Schedule Day'}
      </button>
    </form>
  )
}

// ── Schedule List ────────────────────────────────────────────
function ScheduleList({ schedule, onDeleted }) {
  async function handleDelete(date) {
    if (!confirm(`Delete schedule for ${date}?`)) return
    try {
      await api.delete(`/admin/schedule/${date}`)
      onDeleted()
    } catch {}
  }

  if (!schedule.length) return (
    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No schedules yet.</p>
  )

  return (
    <div className="flex flex-col gap-2">
      {schedule.map((s) => (
        <div key={s.date} className="rounded-xl border px-4 py-3 flex items-start justify-between gap-3"
          style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
          <div>
            <p className="text-sm font-bold mb-1">{s.date}</p>
            <div className="flex flex-col gap-0.5">
              {[['Easy 1', s.easy1], ['Easy 2', s.easy2], ['Medium', s.medium], ['Boss', s.boss]].map(([label, p]) => p && (
                <p key={label} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span style={{ color: DIFF_COLORS[p.difficulty] }}>{label}</span>: {p.title}
                </p>
              ))}
            </div>
          </div>
          <button onClick={() => handleDelete(s.date)}
            className="text-xs px-2 py-1 rounded-lg shrink-0"
            style={{ backgroundColor: 'var(--color-boss)22', color: 'var(--color-boss)' }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Main Admin Page ──────────────────────────────────────────
export default function AdminPage() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('create')
  const [problems, setProblems] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  async function fetchData() {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/admin/problems'),
        api.get('/admin/schedule'),
      ])
      setProblems(pRes.data)
      setSchedule(sRes.data)
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) setForbidden(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchData()
  }, [user])

  if (loading) return <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
  if (forbidden) return (
    <div className="text-center py-16" style={{ color: 'var(--color-boss)' }}>
      Access denied. You are not an admin.
    </div>
  )

  const TABS = [
    { id: 'create', label: '+ New Problem' },
    { id: 'schedule', label: 'Schedule Day' },
    { id: 'scheduled', label: `Scheduled (${schedule.length})` },
    { id: 'problems', label: `Problem Pool (${problems.length})` },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Admin Panel</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Manage problems and daily schedules
      </p>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap rounded-xl p-1 mb-6"
        style={{ backgroundColor: 'var(--color-surface)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs font-semibold rounded-lg"
            style={{
              backgroundColor: tab === t.id ? 'var(--color-primary)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--color-text-muted)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border p-5"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {tab === 'create' && <CreateProblem onCreated={fetchData} />}
        {tab === 'schedule' && <ScheduleDay problems={problems} schedule={schedule} onScheduled={fetchData} />}
        {tab === 'scheduled' && <ScheduleList schedule={schedule} onDeleted={fetchData} />}
        {tab === 'problems' && (
          <div className="flex flex-col gap-2">
            {problems.length === 0
              ? <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No problems yet.</p>
              : problems.map((p) => (
                <div key={p.id} className="rounded-xl border px-4 py-3"
                  style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{p.title}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ color: DIFF_COLORS[p.difficulty], backgroundColor: DIFF_COLORS[p.difficulty] + '22' }}>
                      {p.difficulty}
                    </span>
                  </div>
                  <MathDisplay latex={p.body_latex} />
                  <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    ID: {p.id}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Answer:</span>
                    <MathDisplay latex={p.answer_latex} />
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
