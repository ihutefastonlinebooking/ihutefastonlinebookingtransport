import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/api';
import { clearTokens } from '../utils/auth';

const TABS = [
  { id: 'bookings', label: 'Bookings', icon: '🎫' },
  { id: 'drivers', label: 'Drivers', icon: '👨‍✈️' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboardV2() {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'settings') {
      setData([]);
      return;
    }
    
    fetchData();
  }, [activeTab, page]);

  async function fetchData() {
    setLoading(true);
    try {
      let endpoint = `/admin/${activeTab}?page=${page}&limit=20`;
      if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
      }

      const res = await api.get(endpoint);
      const payload = res.data || res;
      setData(payload.data || payload);
      if (payload.pagination) {
        setTotalPages(payload.pagination.pages);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error(t('auth.sessionExpired', 'Session expired'));
        clearTokens();
        nav('/admin/login', { replace: true });
      } else {
        toast.error(t('common.error', 'Failed to load data'));
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearTokens();
    window.location.replace('/admin/login');
  }

  const filtered = data.filter(item => {
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-primary to-primary/90 text-white p-6 shadow-lg">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">EHUT</h2>
          <p className="text-white/80 text-sm">{t('admin.adminPanel', 'Admin Panel')}</p>
        </div>

        <nav className="space-y-2 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); setSearch(''); }}
              className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/25 border-l-4 border-white'
                  : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-lg bg-red-500 hover:bg-red-600 font-semibold transition-colors"
        >
          {t('auth.logout', 'Logout')}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-md sticky top-0 z-10 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {t(`admin.${activeTab}Desc`, `Manage ${activeTab}`)}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* Language Selector */}
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="en">English</option>
                <option value="sw">Swahili</option>
                <option value="fr">Français</option>
              </select>

              {/* Search */}
              {activeTab !== 'settings' && (
                <input
                  type="text"
                  placeholder={t('common.search', 'Search...')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'settings' ? (
            <AdminSettings />
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">{t('common.loading', 'Loading...')}</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center">
              <p className="text-gray-600 text-lg">{t('common.noData', 'No data found')}</p>
            </div>
          ) : (
            <>
              {/* Data Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {Object.keys(filtered[0] || {})
                          .filter(k => !['id', 'created_at', 'updated_at'].includes(k))
                          .slice(0, 5)
                          .map(key => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left font-semibold text-gray-700 capitalize"
                            >
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">
                          {t('common.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filtered.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          {Object.entries(item)
                            .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
                            .slice(0, 5)
                            .map(([k, v], vIdx) => (
                              <td key={vIdx} className="px-6 py-4 text-gray-900">
                                {typeof v === 'object'
                                  ? JSON.stringify(v).substring(0, 30)
                                  : String(v).substring(0, 50)}
                              </td>
                            ))}
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="text-primary hover:underline font-medium">
                                {t('common.view', 'View')}
                              </button>
                              <button className="text-red-600 hover:underline font-medium">
                                {t('common.delete', 'Delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    {t('common.previous', 'Previous')}
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = i + Math.max(1, page - 2);
                      return p <= totalPages ? (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-2 rounded-lg font-medium ${
                            p === page
                              ? 'bg-primary text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    {t('common.next', 'Next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t('auth.passwordChanged', 'Password changed successfully'));
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || t('common.error', 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">{t('admin.changePassword', 'Change Password')}</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.currentPassword', 'Current Password')}
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.newPassword', 'New Password')}
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.confirmPassword', 'Confirm Password')}
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? t('common.loading', 'Saving...') : t('common.save', 'Save Changes')}
          </button>
        </form>
      </div>
    </div>
  );
}
