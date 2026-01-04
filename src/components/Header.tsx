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
        <button className="ml-2 px-3 py-1 rounded bg-[#222] text-xs text-muted hover:bg-primary hover:text-black transition" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </header>
  )
}
