import React, { useState } from 'react'
import { useAuthStore } from '../features/auth/auth.store'
import { useNavigate } from 'react-router-dom'
import { useUnreadCount } from '../features/notifications/hooks/useUnreadCount'
import NotificationsPanel from '../features/notifications/NotificationsPanel'

export default function Header({ name }: { name?: string }) {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  
  // Fetch unread count
  const { data: unreadCount = 0, isLoading, error } = useUnreadCount()

  // Debug logging (remove in production)
  React.useEffect(() => {
    console.log('Unread count:', unreadCount, 'Loading:', isLoading, 'Error:', error)
  }, [unreadCount, isLoading, error])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const togglePanel = () => {
    console.log('Toggling panel. Current state:', isPanelOpen, 'Unread count:', unreadCount)
    setIsPanelOpen(!isPanelOpen)
  }

  return (
    <>
      <header className="flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3">
          {/* Profile Icon */}
          <div className="w-9 h-9 rounded-full bg-[#222] flex items-center justify-center hover:bg-primary transition cursor-pointer group">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          
          <div>
            <div className="text-sm text-muted">Hola,</div>
            <div className="font-bold text-lg">{name ?? 'Usuario'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <button 
            onClick={togglePanel}
            className="relative w-9 h-9 rounded-full bg-[#222] flex items-center justify-center hover:bg-primary transition group"
            title="Notificaciones"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
              />
            </svg>
            
            {/* Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

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

      {/* Notifications Panel */}
      <NotificationsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  )
}
