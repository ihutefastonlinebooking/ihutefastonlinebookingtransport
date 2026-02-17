import React, { useState, useEffect } from 'react';
import { Button, Card, Loader, Alert } from '../components';
import { userService } from '../services/api';

export const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        
        const statsData = await userService.getUserStats();
        setStats(statsData.data);
      } catch (err) {
        setError(err?.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-light py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Manage your bookings and account</p>
        </div>

        {error && <Alert variant="error" message={error} className="mb-4" />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-primary">{stats?.bookings?.length || 0}</p>
          </Card>
          
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
            <p className="text-3xl font-bold text-primary">RWF {stats?.totalSpent?.toLocaleString() || 0}</p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Status</h3>
            <p className="text-lg">{user?.status === 'active' ? '✓ Active' : 'Inactive'}</p>
          </Card>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-1">
              Book a Trip
            </Button>
            <Button variant="secondary" className="flex-1">
              View Bookings
            </Button>
            <Button variant="outline" className="flex-1">
              Account Settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
