import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Alert } from '../components';
import { authService } from '../services/api';
import { storeToken } from '../utils/auth';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const nav = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      storeToken(response.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      toast.success(t('auth.loginSuccess', 'Login successful'));
      nav('/admin/dashboard');
    } catch (err) {
      setError(err?.message || t('auth.invalidCredentials', 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{t('app.name', 'EHUT')}</h1>
          <p className="text-gray-600">{t('auth.adminLoginTitle', 'Admin Portal')}</p>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('auth.adminLoginTitle', 'Admin Login')}</h2>

          {error && <Alert variant="error" message={error} className="mb-4" />}

          <form onSubmit={handleSubmit}>
            <Input
              label={t('common.email', 'Email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.emailPlaceholder', 'Enter admin email')}
              required
            />

            <Input
              label={t('common.password', 'Password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.passwordPlaceholder', 'Enter admin password')}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mb-4"
              disabled={loading}
            >
              {loading ? t('common.loading', 'Signing in...') : t('common.signIn', 'Sign In')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
