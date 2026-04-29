import { useState, useEffect } from 'react'
import MathDisplay from '../components/MathDisplay/MathDisplay'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

const ALL_TAGS = [
  'u-substitution', 'integration-by-parts', 'trig-substitution',
  'partial-fractions', 'trig-integrals', 'improper-integrals',
  'feynman-technique', 'separable-ode', 'linear-first-order',
  'exact-equations', 'second-order-linear', 'laplace-transform',
]

const DIFFICULTIES = ['easy', 'medium', 'boss']
const DIFF_COLORS = {
  easy: 'var(--color-easy)',
  medium: 'var(--color-medium)',
  boss: 'var(--color-boss)',
}

// ---------- Submit Modal ----------
function SubmitModal({ onClose, onPosted }) {
  const [title, setTitle] = useState('')
  const [bodyLatex, setBodyLatex] = useState('')
  const [answerLatex, setAnswerLatex] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!bodyLatex.trim() || !answerLatex.trim()) {
      setError('Problem and answer are required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/community', {
        title,
        body_latex: bodyLatex,
        answer_latex: answerLatex,
        difficulty,
        technique_tags: selectedTags,
      })
      onPosted()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-base font-bold">Submit a Problem</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
              Title <span style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tricky u-substitution"
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Problem LaTeX + preview */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
              Problem (LaTeX)
            </label>
            <textarea
              value={bodyLatex}
              onChange={(e) => setBodyLatex(e.target.value)}
              placeholder={`\\int x e^x \\, dx`}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border text-sm font-mono outline-none resize-none"
              style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
            {bodyLatex && (
              <div className="mt-2 px-3 py-2 rounded-xl text-center"
                style={{ backgroundColor: 'var(--color-surface-2)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Preview</p>
                <MathDisplay latex={bodyLatex} block />
              </div>
            )}
          </div>

          {/* Answer LaTeX + preview */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
              Answer (LaTeX)
            </label>
            <input
              value={answerLatex}
              onChange={(e) => setAnswerLatex(e.target.value)}
              placeholder={`(x-1)e^x`}
              className="w-full px-3 py-2 rounded-xl border text-sm font-mono outline-none"
              style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
            {answerLatex && (
              <div className="mt-2 px-3 py-2 rounded-xl text-center"
                style={{ backgroundColor: 'var(--color-surface-2)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Preview</p>
                <MathDisplay latex={answerLatex} block />
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor: difficulty === d ? DIFF_COLORS[d] + '22' : 'var(--color-surface-2)',
                    borderColor: difficulty === d ? DIFF_COLORS[d] : 'var(--color-border)',
                    color: difficulty === d ? DIFF_COLORS[d] : 'var(--color-text-muted)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
              Technique Tags <span style={{ fontWeight: 400 }}>(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="text-xs px-3 py-1 rounded-full border transition-all"
                  style={{
                    backgroundColor: selectedTags.includes(tag) ? 'var(--color-primary)22' : 'var(--color-surface-2)',
                    borderColor: selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--color-border)',
                    color: selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--color-boss)' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Posting...' : 'Post Problem'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Post Row ----------
function PostRow({ post }) {
  const { user } = useUserStore()
  const [upvotes, setUpvotes] = useState(post.upvotes)
  const [upvoted, setUpvoted] = useState(false)
  const [solveCount, setSolveCount] = useState(post.solve_count)
  const [commentCount, setCommentCount] = useState(post.comment_count)

  // Try It state
  const [showTry, setShowTry] = useState(false)
  const [tryInput, setTryInput] = useState('')
  const [tryStatus, setTryStatus] = useState('idle') // idle | correct | wrong
  const [solved, setSolved] = useState(false)

  // Discuss state
  const [showDiscuss, setShowDiscuss] = useState(false)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [commentsLoaded, setCommentsLoaded] = useState(false)

  async function handleUpvote() {
    if (!user || upvoted) return
    try {
      const res = await api.post(`/community/${post.id}/upvote`)
      setUpvotes(res.data.upvotes)
      setUpvoted(true)
    } catch (err) {
      if (err.response?.data?.detail === 'Already upvoted.') setUpvoted(true)
    }
  }

  async function handleTrySubmit(e) {
    e.preventDefault()
    if (!tryInput.trim()) return
    try {
      const res = await api.post('/daily/submit', {
        problem_id: post.problem_id,
        answer_latex: tryInput.trim(),
      })
      if (res.data.correct) {
        setTryStatus('correct')
        if (!solved) {
          try {
            await api.post(`/community/${post.id}/solve`)
            setSolveCount((n) => n + 1)
          } catch {}
          setSolved(true)
        }
      } else {
        setTryStatus('wrong')
      }
    } catch {}
  }

  function handleSolveAgain() {
    setTryStatus('idle')
    setTryInput('')
    setShowTry(true)
  }

  async function handleOpenDiscuss() {
    const next = !showDiscuss
    setShowDiscuss(next)
    if (next && !commentsLoaded) {
      try {
        const res = await api.get(`/community/${post.id}/comments`)
        setComments(res.data)
      } catch {}
      setCommentsLoaded(true)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentInput.trim()) return
    try {
      const res = await api.post(`/community/${post.id}/comment`, { body: commentInput })
      setComments((prev) => [...prev, res.data])
      setCommentCount((n) => n + 1)
      setCommentInput('')
    } catch {}
  }

  return (
    <div
      className="rounded-2xl border"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="p-4 flex gap-4">
        {/* Upvote */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={handleUpvote}
            className="text-xs transition-colors"
            style={{ color: upvoted ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            ▲
          </button>
          <span className="text-sm font-bold" style={{ color: upvoted ? 'var(--color-primary)' : undefined }}>
            {upvotes}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {post.title && <span className="text-sm font-semibold">{post.title}</span>}
            <span
              className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide"
              style={{ color: DIFF_COLORS[post.difficulty], backgroundColor: DIFF_COLORS[post.difficulty] + '22' }}
            >
              {post.difficulty}
            </span>
          </div>
          <MathDisplay latex={post.body_latex} className="text-base" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.technique_tags?.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              by @{post.author} · {solveCount} solves
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleOpenDiscuss}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: showDiscuss ? 'var(--color-primary)22' : 'var(--color-surface-2)',
                  color: showDiscuss ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                Discuss ({commentCount})
              </button>
              {solved && !showTry ? (
                <button
                  onClick={handleSolveAgain}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{ backgroundColor: 'var(--color-easy)22', color: 'var(--color-easy)', border: '1px solid var(--color-easy)' }}
                >
                  ✓ Solve Again
                </button>
              ) : (
                <button
                  onClick={() => setShowTry((v) => !v)}
                  className="text-xs px-3 py-1 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  Try It
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Try It panel */}
      {showTry && tryStatus !== 'correct' && (
        <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleTrySubmit} className="flex gap-2">
            <input
              value={tryInput}
              onChange={(e) => setTryInput(e.target.value)}
              placeholder="Your answer (LaTeX)..."
              className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono outline-none"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: tryStatus === 'wrong' ? 'var(--color-boss)' : 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Submit
            </button>
          </form>
          {tryStatus === 'wrong' && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-boss)' }}>Incorrect — try again</p>
          )}
        </div>
      )}
      {showTry && tryStatus === 'correct' && (
        <div className="px-4 pb-4 border-t pt-3 flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-easy)' }}>
            Correct! Well done.
          </span>
          <button
            onClick={handleSolveAgain}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Discuss panel */}
      {showDiscuss && (
        <div className="px-4 pb-4 border-t pt-3 flex flex-col gap-3"
          style={{ borderColor: 'var(--color-border)' }}>
          {comments.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No comments yet. Start the discussion!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((c) => (
                <div key={c.id}>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>@{c.username} </span>
                  <span className="text-xs" style={{ color: 'var(--color-text)' }}>{c.body}</span>
                </div>
              ))}
            </div>
          )}
          {user && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Main Page ----------
export default function CommunityFeed() {
  const { user } = useUserStore()
  const [posts, setPosts] = useState([])
  const [activeTag, setActiveTag] = useState(null)
  const [sort, setSort] = useState('hot')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  function fetchPosts() {
    setLoading(true)
    const params = { sort }
    if (activeTag) params.tag = activeTag
    api.get('/community', { params })
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [activeTag, sort])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onPosted={fetchPosts}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Community</h1>
        <button
          onClick={() => user ? setShowModal(true) : null}
          className="text-sm font-semibold px-4 py-2 rounded-xl"
          style={{
            backgroundColor: 'var(--color-primary)', color: '#fff',
            opacity: user ? 1 : 0.5, cursor: user ? 'pointer' : 'not-allowed',
          }}
          title={!user ? 'Log in to submit' : ''}
        >
          + Submit
        </button>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-4">
        {['hot', 'new', 'most-solved'].map((s) => (
          <button key={s} onClick={() => setSort(s)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
            style={{
              backgroundColor: sort === s ? 'var(--color-primary)' : 'var(--color-surface)',
              color: sort === s ? '#fff' : 'var(--color-text-muted)',
            }}>
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setActiveTag(null)}
          className="text-xs px-3 py-1 rounded-full"
          style={{
            backgroundColor: !activeTag ? 'var(--color-primary)22' : 'var(--color-surface)',
            color: !activeTag ? 'var(--color-primary)' : 'var(--color-text-muted)',
            border: `1px solid ${!activeTag ? 'var(--color-primary)' : 'var(--color-border)'}`,
          }}>
          All
        </button>
        {ALL_TAGS.map((tag) => (
          <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className="text-xs px-3 py-1 rounded-full"
            style={{
              backgroundColor: activeTag === tag ? 'var(--color-primary)22' : 'var(--color-surface)',
              color: activeTag === tag ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: `1px solid ${activeTag === tag ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}>
            {tag}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          No problems yet. Be the first to submit one!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => <PostRow key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
