import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './features/auth/LoginPage'
import HomePage from './features/home/HomePage'
import GoogleCallbackPage from './features/auth/GoogleCallbackPage'
import CreateMatchWizardPage from './features/matches/create/CreateMatchWizardPage'
import MatchSummaryPage from './features/matches/summary/MatchSummaryPage'
import ChallengePage from './features/challenge/ChallengePage'
import InviteAcceptPage from './features/invites/InviteAcceptPage'
import MatchCreateLayout from './features/matches/create/MatchCreateLayout'
import StepASportSelection from './features/matches/create/StepASportSelection'
import StepBHomeTeamSelection from './features/matches/create/StepBHomeTeamSelection'
import StepCAwayTeamSelection from './features/matches/create/StepCAwayTeamSelection'
import StepDFormatSelection from './features/matches/create/StepDFormatSelection'
import TeamCreatePage from './features/teams/TeamCreatePage'
import { useAuthStore } from './features/auth/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
})

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<GoogleCallbackPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/create/*"
          element={
            <ProtectedRoute>
              <MatchCreateLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StepASportSelection />} />
          <Route path="home-team" element={<StepBHomeTeamSelection />} />
          <Route path="away-team" element={<StepCAwayTeamSelection />} />
          <Route path="summary" element={<StepDFormatSelection />} />
        </Route>
        <Route
          path="/teams/create"
          element={
            <ProtectedRoute>
              <TeamCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/new"
          element={
            <ProtectedRoute>
              <CreateMatchWizardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/:matchId/summary"
          element={
            <ProtectedRoute>
              <MatchSummaryPage />
            </ProtectedRoute>
          }
        />
        
        {/* Public Routes */}
        <Route path="/challenge/:token" element={<ChallengePage />} />
        <Route path="/invites/:token" element={<InviteAcceptPage />} />
        
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </QueryClientProvider>
  )
}
