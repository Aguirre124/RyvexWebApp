import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from './auth.types'
import { authService } from './auth.service'

type AuthState = {
  token: string | null
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: (partial: Partial<AuthState>) => void) => ({
      token: null,
      user: null,
      loading: false,
      loginWithGoogle: async () => {
        set({ loading: true })
        try {
          // Start Google sign-in process (this may redirect the user)
          authService.startGoogleSignIn()
          // If you expect to handle a callback, you may need to call handleGoogleCallback elsewhere
        } finally {
          set({ loading: false })
        }
      },
      loginWithEmail: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const res = await authService.signInWithEmail(email, password)
          set({ token: res.token, user: res.user })
        } finally {
          set({ loading: false })
        }
      },
      register: async (name: string, email: string, password: string) => {
        set({ loading: true })
        try {
          const res = await authService.register(name, email, password)
          set({ token: res.token, user: res.user })
        } finally {
          set({ loading: false })
        }
      },
      logout: async () => {
        set({ loading: true })
        try {
          await authService.logout()
        } catch {}
        set({ token: null, user: null, loading: false })
      }
    }),
    { name: 'ryvex-auth' }
  )
)
