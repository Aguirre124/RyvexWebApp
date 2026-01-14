// App routes for RYVEX
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../features/home/HomePage';
import CreateMatchWizardPage from '../features/matches/create/CreateMatchWizardPage';
import ChallengePage from '../features/challenge/ChallengePage';
import InviteAcceptPage from '../features/invites/InviteAcceptPage';
import MatchSummaryPage from '../features/matches/MatchSummaryPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/matches/new" element={<ProtectedRoute><CreateMatchWizardPage /></ProtectedRoute>} />
      <Route path="/matches/:matchId/summary" element={<ProtectedRoute><MatchSummaryPage /></ProtectedRoute>} />
      <Route path="/challenge/:token" element={<ChallengePage />} />
      <Route path="/invites/:token" element={<InviteAcceptPage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
