import React from 'react'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { useAuthStore } from '../auth/auth.store'

const mockCompetitions = [
  { id: 'c1', name: 'Liga de Domingo', games: 8 },
  { id: 'c2', name: 'Copa Ciudad', games: 4 }
]

export default function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen pb-20 bg-white">
      <Header name={user?.name} />

      <main className="px-4 space-y-4">
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold">Crear Partido</button>
          <button className="flex-1 py-3 rounded-lg bg-[#0b1220] border border-[#1f2937] text-white font-semibold">Crear Torneo</button>
        </div>

        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Mis Competiciones</h3>
            <span className="text-xs text-muted">Ver todas</span>
          </div>
          <div className="space-y-2">
            {mockCompetitions.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-[#071422] rounded">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted">{c.games} partidos</div>
                </div>
                <div className="text-xs text-primary">Gestionar</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="font-bold mb-2">Partido Activo</h3>
          <div className="text-sm text-muted">No hay partido activo. Crea uno para comenzar.</div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
