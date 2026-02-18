import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { storeToken } from '../utils/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminLogin() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return toast.error('Please provide email and password');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { tokens } = res.data.data;
      if (!tokens || !tokens.accessToken) throw new Error('No token returned');
      storeToken(tokens.accessToken);
      toast.success('Login successful');
      nav('/admin/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        <label className="block mb-2">Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          className="w-full p-2 border rounded mb-4"
          required
        />
        <label className="block mb-2">Password</label>
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          className="w-full p-2 border rounded mb-6"
          required
        />
        <button type="submit" className="w-full bg-primary text-white py-2 rounded" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
