import React from 'react'
import { NavLink } from 'react-router-dom'

const items = [
  { id: 'home', label: 'Inicio', to: '/home' },
  { id: 'tournaments', label: 'Torneos', to: '/home' },
  { id: 'matches', label: 'Partidos', to: '/home' },
  { id: 'stats', label: 'Estadísticas', to: '/home' },
  { id: 'profile', label: 'Perfil', to: '/home' }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#061022] border-t border-[#0f1724] py-2">
      <div className="max-w-lg mx-auto px-4 flex justify-between items-center">
        {items.map((it) => (
          <NavLink key={it.id} to={it.to} className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-primary' : 'text-muted'}`}>
            <div className="w-6 h-6 mb-1 bg-[#0b1220] rounded-full flex items-center justify-center">•</div>
            <div>{it.label}</div>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
