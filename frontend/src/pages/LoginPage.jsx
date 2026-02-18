import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Alert } from '../components';
import { authService } from '../services/api';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('auth.invalidCredentials', 'Login failed. Please check your credentials and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('app.name', 'EHUT')}</h1>
          <p className="text-white text-opacity-90">{t('app.slogan', 'Smart Transport Booking Platform')}</p>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('auth.loginTitle', 'Sign In to EHUT')}</h2>

          {error && <Alert variant="error" message={error} className="mb-4" />}

          <form onSubmit={handleSubmit}>
            <Input
              label={t('common.email', 'Email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.emailPlaceholder', 'Enter your email')}
              required
            />

            <Input
              label={t('common.password', 'Password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
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

          <div className="text-center text-sm text-gray-600">
            <p>{t('auth.dontHaveAccount', "Don't have an account?")} <Link to="/register" className="text-primary hover:underline font-semibold">{t('common.signUp', 'Sign up')}</Link></p>
            <p className="mt-2"><Link to="/forgot-password" className="text-primary hover:underline">{t('auth.forgotPassword', 'Forgot password?')}</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
