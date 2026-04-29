import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useUserStore } from '../store/userStore'

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', friendCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setToken } = useUserStore()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        friend_code: form.friendCode || undefined,
      })
      setToken(res.data.token)
      setUser(res.data.user)
      navigate('/daily')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-1">Create account</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Already have one?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)' }}>Log in</Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { name: 'username', label: 'Username', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'password', label: 'Password', type: 'password' },
        ].map(({ name, label, type }) => (
          <div key={name}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </label>
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        ))}

        {/* Friend code — optional */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
            Friend Code <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional — both get +50 XP)</span>
          </label>
          <input
            type="text"
            name="friendCode"
            value={form.friendCode}
            onChange={handleChange}
            placeholder="e.g. DIF-3K9"
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none font-mono"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-boss)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm mt-2"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
