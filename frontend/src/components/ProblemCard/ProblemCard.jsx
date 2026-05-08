import { useState, useEffect } from 'react'
import MathDisplay from '../MathDisplay/MathDisplay'
import AttemptTracker from './AttemptTracker'
import api from '../../utils/api'
import { useUserStore } from '../../store/userStore'

const COOLDOWN_SECONDS = 60
const MEDIUM_ATTEMPTS_PER_ROUND = 3

const DIFFICULTY_COLORS = {
  easy: 'var(--color-easy)',
  medium: 'var(--color-medium)',
  boss: 'var(--color-boss)',
}

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  boss: 'Boss',
}

const STORAGE_KEY = (id) => `cooldown_until_${id}`

function getStoredSecondsLeft(problemId) {
  const until = localStorage.getItem(STORAGE_KEY(problemId))
  if (!until) return 0
  const remaining = Math.ceil((Number(until) - Date.now()) / 1000)
  return remaining > 0 ? remaining : 0
}

function getGuestSession() {
  let session = localStorage.getItem('guest_session')
  if (!session) {
    session = crypto.randomUUID()
    localStorage.setItem('guest_session', session)
  }
  return session
}

export default function ProblemCard({ problem, onSolved, initialSolved = false }) {
  const { user, setStreak } = useUserStore()
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [roundAttempts, setRoundAttempts] = useState(0)
  const [status, setStatus] = useState(initialSolved ? 'correct' : 'idle')
  const [shake, setShake] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState(null)

  const storedLeft = getStoredSecondsLeft(problem.id)
  const [cooldown, setCooldown] = useState(storedLeft > 0)
  const [secondsLeft, setSecondsLeft] = useState(storedLeft > 0 ? storedLeft : COOLDOWN_SECONDS)
  const [xpEarned, setXpEarned] = useState(0)

  const isMedium = problem.difficulty === 'medium'
  const maxAttempts = problem.difficulty === 'boss' ? 1 : null
  const disabled = status === 'correct' || status === 'failed' || cooldown

  useEffect(() => {
    if (!cooldown) return
    const interval = setInterval(() => {
      const remaining = getStoredSecondsLeft(problem.id)
      if (remaining <= 0) {
        clearInterval(interval)
        localStorage.removeItem(STORAGE_KEY(problem.id))
        setCooldown(false)
        setRoundAttempts(0)
        setStatus('idle')
        setSecondsLeft(COOLDOWN_SECONDS)
      } else {
        setSecondsLeft(remaining)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown, problem.id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || disabled) return

    const newAttempts = attempts + 1
    const newRoundAttempts = roundAttempts + 1
    setAttempts(newAttempts)
    setRoundAttempts(newRoundAttempts)

    try {
      const res = await api.post('/daily/submit', {
        problem_id: problem.id,
        answer_latex: input.trim(),
        guest_session: user ? undefined : getGuestSession(),
      })

      if (res.data.correct) {
        setStatus('correct')
        setXpEarned(res.data.xp_earned || 0)
        if (res.data.streak !== undefined) setStreak(res.data.streak)
        if (onSolved) onSolved(problem.id, newAttempts)
      } else {
        // Boss: one shot only
        if (problem.difficulty === 'boss') {
          setStatus('failed')
          setCorrectAnswer(res.data.correct_answer)
          return
        }
        // Medium: cooldown after every 3 wrong attempts in a round
        if (isMedium && newRoundAttempts >= MEDIUM_ATTEMPTS_PER_ROUND) {
          localStorage.setItem(STORAGE_KEY(problem.id), Date.now() + COOLDOWN_SECONDS * 1000)
          setCooldown(true)
          setStatus('wrong')
          return
        }
        setStatus('wrong')
        triggerShake()
      }
    } catch {
      setStatus('wrong')
      triggerShake()
    }
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor:
          status === 'correct'
            ? 'var(--color-easy)'
            : status === 'failed' || cooldown
            ? 'var(--color-boss)'
            : 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{
            color: DIFFICULTY_COLORS[problem.difficulty],
            backgroundColor: DIFFICULTY_COLORS[problem.difficulty] + '22',
          }}
        >
          {DIFFICULTY_LABELS[problem.difficulty]}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {problem.technique_tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                color: 'var(--color-text-muted)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Problem statement */}
      <div className="text-center py-4">
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
          {problem.title || 'Evaluate the expression:'}
        </p>
        <MathDisplay latex={problem.body_latex} block className="text-2xl" />
      </div>

      {/* Cooldown overlay */}
      {cooldown && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-medium)' }}>
            3 wrong attempts — take a breather
          </p>

          {/* Ad placeholder */}
          <div
            className="rounded-lg flex items-center justify-center text-xs font-mono"
            style={{
              height: '80px',
              backgroundColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
              border: '1px dashed var(--color-text-muted)',
            }}
          >
            [ Ad placeholder ]
          </div>

          {/* Countdown ring */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--color-medium)' }}>
              {secondsLeft}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              seconds until you can try again
            </span>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full mt-1" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(secondsLeft / COOLDOWN_SECONDS) * 100}%`,
                  backgroundColor: 'var(--color-medium)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input form */}
      {!disabled && !cooldown && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer (LaTeX)..."
            className={`w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-all ${
              shake ? 'animate-[shake_0.4s_ease]' : ''
            }`}
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: status === 'wrong' ? 'var(--color-boss)' : 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          {input.trim() && (
            <div
              className="px-4 py-3 rounded-xl text-center"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Preview</p>
              <MathDisplay latex={input} block />
            </div>
          )}
          <div className="flex items-center justify-between">
            {isMedium ? (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {MEDIUM_ATTEMPTS_PER_ROUND - roundAttempts} attempt{MEDIUM_ATTEMPTS_PER_ROUND - roundAttempts !== 1 ? 's' : ''} before cooldown
              </span>
            ) : (
              <AttemptTracker
                max={maxAttempts}
                used={attempts}
                correct={status === 'correct'}
              />
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {/* Result feedback */}
      {status === 'wrong' && (
        <div
          className="rounded-xl px-4 py-3 text-center text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-boss)22', color: 'var(--color-boss)' }}
        >
          Incorrect — try again.
        </div>
      )}
      {status === 'correct' && (
        <div
          className="rounded-xl px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-easy)22', color: 'var(--color-easy)' }}
        >
          Correct! Well done.
          {xpEarned > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: 'var(--color-easy)', color: '#000' }}>
              +{xpEarned} XP
            </span>
          )}
        </div>
      )}
      {status === 'failed' && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--color-boss)22', color: 'var(--color-boss)' }}
        >
          <p className="font-semibold mb-1">Out of attempts.</p>
          {correctAnswer && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Answer: <MathDisplay latex={correctAnswer} />
            </p>
          )}
        </div>
      )}
    </div>
  )
}
