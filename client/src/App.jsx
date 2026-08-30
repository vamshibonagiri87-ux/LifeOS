import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute.jsx';
import { AppShell } from './components/AppShell/AppShell.jsx';

import { Landing } from './pages/Landing.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Responsibilities } from './pages/Responsibilities.jsx';
import { ResponsibilityDetails } from './pages/ResponsibilityDetails.jsx';
import { Processing } from './pages/Processing.jsx';
import { ProcessingDetails } from './pages/ProcessingDetails.jsx';
import { Integrations } from './pages/Integrations.jsx';
import { Documents } from './pages/Documents.jsx';
import { Assistant } from './pages/Assistant.jsx';
import { Activity } from './pages/Activity.jsx';
import { Settings } from './pages/Settings.jsx';

export default function App() {
  const { initTheme, checkAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application Routes inside AppShell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/responsibilities" element={<Responsibilities />} />
            <Route path="/responsibilities/:id" element={<ResponsibilityDetails />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/processing/:id" element={<ProcessingDetails />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
