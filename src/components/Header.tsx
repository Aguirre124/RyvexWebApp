import React from 'react'
import { useAuthStore } from '../features/auth/auth.store'
import { useNavigate } from 'react-router-dom'

export default function Header({ name }: { name?: string }) {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  return (
    <header className="flex items-center justify-between py-4 px-4">
      <div>
        <div className="text-sm text-muted">Hola,</div>
        <div className="font-bold text-lg">{name ?? 'Usuario'}</div>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-[#071224] flex items-center justify-center">🔔</button>
        <div className="w-9 h-9 rounded-full bg-[#0b1220] flex items-center justify-center">👤</div>
        <button 
          className="w-9 h-9 rounded-full bg-[#222] flex items-center justify-center hover:bg-primary transition group" 
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <svg 
            className="w-5 h-5 text-white group-hover:text-black transition" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
