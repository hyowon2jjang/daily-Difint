import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ProblemCard from '../components/ProblemCard/ProblemCard'
import LatexCheatSheet from '../components/LatexCheatSheet/LatexCheatSheet'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

const TABS = ['Easy 1', 'Easy 2', 'Medium']
const BOSS_DAYS = [0, 6] // Sunday, Saturday

function isWeekend() {
  return BOSS_DAYS.includes(new Date().getDay())
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
}

export default function DailyChallenge() {
  const { user, setStreak } = useUserStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [problems, setProblems] = useState(null)
  const [solved, setSolved] = useState({})
  const [loading, setLoading] = useState(true)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const promptShownRef = useRef(false)
  const weekend = isWeekend()

  const allTabs = weekend ? [...TABS, 'Boss'] : TABS

  useEffect(() => {
    Promise.all([
      api.get('/daily/today'),
      api.get('/daily/status'),
    ])
      .then(([todayRes, statusRes]) => {
        setProblems(todayRes.data)
        const initialSolved = {}
        for (const id of statusRes.data.solved) {
          initialSolved[id] = true
        }
        setSolved(initialSolved)
        setStreak(statusRes.data.streak ?? 0)
      })
      .catch(() => setProblems(null))
      .finally(() => setLoading(false))
  }, [])

  const orderedProblems = problems
    ? [problems.easy1, problems.easy2, problems.medium, problems.boss].filter(Boolean)
    : []

  const requiredSolved = problems
    ? [problems.easy1?.id, problems.easy2?.id, problems.medium?.id]
        .filter(Boolean)
        .every((id) => solved[id])
    : false

  useEffect(() => {
    if (requiredSolved && !user && !promptShownRef.current) {
      promptShownRef.current = true
      setShowSignupPrompt(true)
    }
  }, [requiredSolved, user])

  function handleSolved(problemId, attemptCount) {
    setSolved((prev) => ({ ...prev, [problemId]: attemptCount }))
  }

  const currentProblem = orderedProblems[activeTab]

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Daily Challenge</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {getTodayLabel()}
          </p>
        </div>
        {requiredSolved && (
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-easy)22', color: 'var(--color-easy)' }}
          >
            Day complete!
          </span>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1 mb-6"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {allTabs.map((label, i) => {
          const problem = orderedProblems[i]
          const isSolved = problem && solved[problem.id]
          const isBoss = label === 'Boss'

          return (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative"
              style={{
                backgroundColor: activeTab === i ? 'var(--color-surface-2)' : 'transparent',
                color: isSolved
                  ? 'var(--color-easy)'
                  : isBoss
                  ? 'var(--color-boss)'
                  : activeTab === i
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
              }}
            >
              {isSolved ? `${label} ✓` : label}
            </button>
          )
        })}
      </div>

      {/* Problem display */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          Loading today's problems...
        </div>
      ) : !currentProblem ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          Problem not available yet.
        </div>
      ) : (
        <ProblemCard
          key={currentProblem.id}
          problem={currentProblem}
          onSolved={handleSolved}
          initialSolved={!!solved[currentProblem.id]}
        />
      )}

      <LatexCheatSheet />

      {showSignupPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 text-center"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="text-3xl">🎉</div>
            <h2 className="text-lg font-bold">You completed today's challenge!</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Sign up to save your streak and XP — your progress will be waiting for you tomorrow.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Sign up and save progress
            </button>
            <button
              onClick={() => setShowSignupPrompt(false)}
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {problems && (
        <div className="mt-6 flex items-center gap-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Required progress:
          </p>
          <div className="flex gap-2">
            {[problems.easy1, problems.easy2, problems.medium].filter(Boolean).map((p) => (
              <span
                key={p.id}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: solved[p.id]
                    ? 'var(--color-easy)'
                    : 'var(--color-border)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
