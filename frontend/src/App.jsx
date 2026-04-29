import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import BottomNav from './components/BottomNav/BottomNav'
import Landing from './pages/Landing'
import DailyChallenge from './pages/DailyChallenge'
import CommunityFeed from './pages/CommunityFeed'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminPage from './pages/AdminPage'
import { useUserStore } from './store/userStore'
import api from './utils/api'

export default function App() {
  const { user, setStreak } = useUserStore()

  useEffect(() => {
    if (!user) return
    api.get('/daily/status')
      .then((res) => setStreak(res.data.streak ?? 0))
      .catch(() => {})
  }, [user?.id])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/daily" element={<DailyChallenge />} />
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
