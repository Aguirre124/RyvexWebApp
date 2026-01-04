import { User } from './auth.types'

const fakeJwt = () => 'eyJhbGci...mocked.jwt.token'

export const authService = {
    async register(name: string, email: string, password: string) {
      const baseUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Registration failed')
      }
      const data = await res.json()
      return { token: data.accessToken, user: data.user as User }
    },
  startGoogleSignIn() {
    const baseUrl = import.meta.env.VITE_API_URL || ''
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${baseUrl}/auth/google`;
  },

  async handleGoogleCallback(query: string) {
    // query: window.location.search (e.g. ?code=...&state=...)
    const baseUrl = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${baseUrl}/auth/google/callback${query}`, {
      credentials: 'include'
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Google login failed')
    }
    const data = await res.json()
    return { token: data.accessToken, user: data.user as User }
  },

  async signInWithEmail(email: string, password: string) {
    const baseUrl = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Login failed')
    }
    // Expected response: { accessToken, user: { id, name, email } }
    const data = await res.json()
    return { token: data.accessToken, user: data.user as User }
  },

  async logout() {
    const baseUrl = import.meta.env.VITE_API_URL || ''
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
