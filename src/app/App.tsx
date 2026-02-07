import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './components/Dashboard';
import { SOSMonitoring } from './components/SOSMonitoring';
import { AlertBroadcasting } from './components/AlertBroadcasting';
import { ShelterManagement } from './components/ShelterManagement';
import { ResourceManagement } from './components/ResourceManagement';
import { AdminManagement } from './components/AdminManagement';
import { Toaster } from './components/ui/sonner';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App Router Component
const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sos"
        element={
          <ProtectedRoute allowedRoles={['System Admin', 'Admin', 'First Responder']}>
            <DashboardLayout>
              <SOSMonitoring />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute allowedRoles={['System Admin', 'Admin', 'First Responder']}>
            <DashboardLayout>
              <AlertBroadcasting />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/shelters"
        element={
          <ProtectedRoute allowedRoles={['System Admin', 'Admin', 'Shelter Manager']}>
            <DashboardLayout>
              <ShelterManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={['System Admin', 'Admin', 'Resource Manager']}>
            <DashboardLayout>
              <ResourceManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['System Admin', 'Admin']}>
            <DashboardLayout>
              <AdminManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}