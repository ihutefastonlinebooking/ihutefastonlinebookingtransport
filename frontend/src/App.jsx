import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { HomePage, LoginPage, RegisterPage, DashboardPage, AdminLogin, BookingPage, DriverScanPage, AdminDashboard } from './pages';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/driver/scan" element={<ProtectedRoute><DriverScanPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </HelmetProvider>
    </I18nextProvider>
  );
}

export default App;
