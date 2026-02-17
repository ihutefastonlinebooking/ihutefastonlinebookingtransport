import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

/**
 * Protected Route Component
 * Handles authentication and role-based access control
 * Redirects unauthorized users to appropriate pages
 */
const ProtectedRoute = ({ children, requiredRoles = [], redirectTo = '/login', adminOnly = false }) => {
  const { user, accessToken, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Still verifying token
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login or specified redirect page
  if (!isAuthenticated || !accessToken) {
    const redirectPath = adminOnly ? '/admin/login' : redirectTo;
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    // Redirect based on user's role to appropriate dashboard
    const roleRedirects = {
      super_admin: '/admin/dashboard',
      company_admin: '/company/dashboard',
      driver: '/driver/dashboard',
      client: '/dashboard',
    };

    const redirectPath = roleRedirects[user?.role] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;
