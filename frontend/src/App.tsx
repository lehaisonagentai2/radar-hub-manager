import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AdministratorPage from './pages/AdministratorPage';
import HQPage from './pages/HQPage';
import OperatorPage from './pages/OperatorPage';
import Navbar from './components/Navbar';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role_id)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar />}
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              user ? (
                user.role_id === 'ADMIN' ? <Navigate to="/admin" replace /> :
                user.role_id === 'HQ' ? <Navigate to="/hq" replace /> :
                <Navigate to="/operator" replace />
              ) : <Navigate to="/login" replace />
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdministratorPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/hq" 
            element={
              <ProtectedRoute allowedRoles={['HQ']}>
                <HQPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/operator" 
            element={
              <ProtectedRoute allowedRoles={['OPERATOR']}>
                <OperatorPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            } 
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
