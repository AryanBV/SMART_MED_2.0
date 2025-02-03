// File: /client/src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import CreateProfilePage from '@/pages/CreateProfilePage';
import FamilyTreePage from '@/pages/FamilyTreePage';
import DocumentsPage from '@/pages/DocumentsPage';
import SettingsPage from '@/pages/SettingsPage';
import { Toaster } from '@/components/ui/toaster';
import OCRTestPage from '@/pages/OCRTestPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Profile Creation Route */}
        <Route
          path="/create-profile"
          element={
            <ProtectedRoute requireProfile={false}>
              <CreateProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireProfile={true}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Dashboard and Settings Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireProfile={true}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="family-tree" element={<FamilyTreePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          {/* Change this line */}
          <Route path="ocr-test" element={<OCRTestPage />} /> {/* Remove the leading slash */}
          {/* Settings Routes */}
          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<SettingsPage />} />
            <Route path="account" element={<SettingsPage />} />
            <Route path="documents" element={<SettingsPage />} />
            <Route path="family" element={<SettingsPage />} />
            <Route path="app" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Redirect to dashboard if no matching route */}
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;