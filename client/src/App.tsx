import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import FamilyTreePage from '@/pages/FamilyTreePage';
import DocumentsPage from '@/pages/DocumentsPage';
import { Toaster } from '@/components/ui/toaster';

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
              <ProfilePage />
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
        <Route
          path="/dashboard"
          element={
              <ProtectedRoute requireProfile={true}>
                  <DashboardLayout />
              </ProtectedRoute>
          }
        >
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="family-tree" element={<FamilyTreePage />} />
            <Route path="documents" element={<DocumentsPage />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;