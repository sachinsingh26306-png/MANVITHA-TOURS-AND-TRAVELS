import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import Drivers from './pages/Admin/Drivers';
import Trips from './pages/Admin/Trips';
import Expenses from './pages/Admin/Expenses';
import Settlements from './pages/Admin/Settlements';
import Reports from './pages/Admin/Reports';

import DriverDashboard from './pages/Driver/Dashboard';
import TripsList from './pages/Driver/TripsList';
import TripDetails from './pages/Driver/TripDetails';
import SettlementHistory from './pages/Driver/SettlementHistory';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Redirect helper component for / root path
const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'admin' 
    ? <Navigate to="/admin" replace /> 
    : <Navigate to="/driver" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute requiredRole="admin">
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="trips" element={<Trips />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Driver Protected Routes */}
          <Route 
            path="/driver" 
            element={
              <PrivateRoute requiredRole="driver">
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DriverDashboard />} />
            <Route path="trips" element={<TripsList />} />
            <Route path="trips/:id" element={<TripDetails />} />
            <Route path="settlements" element={<SettlementHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback Catch All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
