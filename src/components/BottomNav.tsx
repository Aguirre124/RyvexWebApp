import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const items = [
  { id: 'tournaments', label: 'Torneos', to: '/home' },
  { id: 'matches', label: 'Partidos', to: '/home' },
  { id: 'home', label: 'Inicio', to: '/home', isHome: true },
  { id: 'stats', label: 'Estadísticas', to: '/home' },
  { id: 'profile', label: 'Perfil', to: '/home' }
]

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#061022] border-t border-[#0f1724] py-2">
      <div className="max-w-lg mx-auto px-4 flex justify-between items-center">
        {items.map((it) => {
          if (it.isHome) {
            return (
              <button
                key={it.id}
                onClick={() => navigate('/home')}
                className="flex flex-col items-center text-xs text-primary"
              >
                <div className="w-10 h-10 mb-1 bg-[#0b1220] rounded-full flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                    />
                  </svg>
                </div>
                <div>{it.label}</div>
              </button>
            )
          }

          return (
            <NavLink 
              key={it.id} 
              to={it.to} 
              className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-primary' : 'text-muted'}`}
            >
              <div className="w-6 h-6 mb-1 bg-[#0b1220] rounded-full flex items-center justify-center">•</div>
              <div>{it.label}</div>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
