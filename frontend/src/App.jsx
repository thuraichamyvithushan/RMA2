import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PublicRmaForm from './pages/PublicRmaForm';
import AdminDashboard from './pages/AdminDashboard';
import StaffList from './pages/StaffList';
import Profile from './pages/Profile';
import DashboardLayout from './components/DashboardLayout';

const ProtectedRoute = ({ children }) => {
  const { user, role, loading, syncing } = useAuth();

  // Show loading if we are initial loading OR if we have a user but are still fetching their role
  if (loading || (user && syncing && !role)) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // staff role should not access dashboard areas
  if (role === 'staff') return <Navigate to="/" />;

  // Allow Admin and Representative
  if (role !== 'admin' && role !== 'representative') return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRmaForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute>
              <StaffList />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
