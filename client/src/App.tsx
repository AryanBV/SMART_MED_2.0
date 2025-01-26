// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import FamilyTreePage from '@/pages/FamilyTreePage';
import DocumentsPage from '@/pages/DocumentsPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes with DashboardLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="family-tree" element={<FamilyTreePage />} />
            <Route path="documents" element={<DocumentsPage />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;