import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { HomePage, LoginPage, RegisterPage, DashboardPage, AdminLogin, BookingPage, BookingFlow, BookingRequestPage, DriverScanPage, AdminDashboard } from './pages';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const initAuth = useAuthStore(state => state.initAuth);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/book-request" element={<BookingRequestPage />} />
            <Route path="/book-flow" element={<BookingFlow />} />
            
            {/* Client Routes */}
            <Route 
              path="/book" 
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <BookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Driver Routes */}
            <Route 
              path="/driver/scan" 
              element={
                <ProtectedRoute requiredRoles={['driver']}>
                  <DriverScanPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/driver/dashboard" 
              element={
                <ProtectedRoute requiredRoles={['driver']}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'company_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company/dashboard" 
              element={
                <ProtectedRoute requiredRoles={['company_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </HelmetProvider>
    </I18nextProvider>
  );
}

export default App;
