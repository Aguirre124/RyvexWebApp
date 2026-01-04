import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './auth.store'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore()

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const accessToken = params.get('accessToken')
      const refreshToken = params.get('refreshToken')
      const userRaw = params.get('user')
      if (!accessToken || !userRaw) throw new Error('Faltan datos de autenticación')
      const user = JSON.parse(decodeURIComponent(userRaw))
      setAuth.token = accessToken
      setAuth.user = user
      // Opcional: guardar refreshToken si lo usas
      navigate('/home')
    } catch (e: any) {
      alert(e.message || 'Error en login con Google')
      navigate('/login')
    }
    // eslint-disable-next-line
  }, [])

  return <div className="min-h-screen flex items-center justify-center text-lg">Iniciando sesión con Google...</div>
}
