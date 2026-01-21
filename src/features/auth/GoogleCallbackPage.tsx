import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './auth.store'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(location.search)
        const accessToken = params.get('accessToken')
        const refreshToken = params.get('refreshToken')
        const userRaw = params.get('user')
        
        const debug = {
          hasAccessToken: !!accessToken,
          accessTokenLength: accessToken?.length,
          hasRefreshToken: !!refreshToken,
          hasUserRaw: !!userRaw,
          fullSearch: location.search,
          allParams: Array.from(params.entries())
        }
        
        console.log('Google callback debug:', debug)
        setDebugInfo(debug)
        
        if (!accessToken || !userRaw) {
          throw new Error('Faltan datos de autenticación. Verifica que el backend esté enviando accessToken y user en la URL.')
        }
        
        const user = JSON.parse(decodeURIComponent(userRaw))
        
        console.log('Parsed user:', user)
        console.log('Before setState - Current auth:', useAuthStore.getState())
        
        // Use Zustand's set method properly - use the setter from inside the store
        useAuthStore.setState({ 
          token: accessToken, 
          user: user,
          loading: false
        })
        
        // Wait a bit to ensure state is persisted
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('After setState - Current auth:', useAuthStore.getState())
        
        // Verify the state was actually set
        const currentState = useAuthStore.getState()
        if (!currentState.token || !currentState.user) {
          throw new Error('El estado de autenticación no se guardó correctamente')
        }
        
        console.log('Auth state verified, navigating to home')
        
        // Navigate to home
        navigate('/home', { replace: true })
      } catch (e: any) {
        console.error('Google callback error:', e)
        setError(e.message || 'Error en login con Google')
        
        // Show error and redirect after 5 seconds
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 5000)
      }
    }

    processCallback()
  }, [location, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">❌</div>
          <div className="text-lg text-white mb-2">Error de autenticación</div>
          <div className="text-sm text-gray-400 mb-4">{error}</div>
          {debugInfo && (
            <div className="text-left bg-gray-900 p-3 rounded text-xs text-gray-400 mb-4 overflow-auto">
              <div className="font-bold mb-2">Debug Info:</div>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          <div className="text-xs text-gray-500">Redirigiendo al login en 5 segundos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <div className="text-lg text-white mb-2">Iniciando sesión con Google...</div>
        {debugInfo && (
          <div className="text-xs text-gray-500 mt-4">
            Procesando datos de autenticación...
          </div>
        )}
      </div>
    </div>
  )
}
