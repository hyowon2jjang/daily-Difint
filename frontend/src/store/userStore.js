import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,          // { id, username, email, xp, level, friendCode }
      streak: 0,
      token: null,

      setUser: (user) => set({ user }),
      setStreak: (streak) => set({ streak }),
      setToken: (token) => set({ token }),

      logout: () => set({ user: null, streak: 0, token: null }),
    }),
    {
      name: 'dailydifint-user',
    }
  )
)
