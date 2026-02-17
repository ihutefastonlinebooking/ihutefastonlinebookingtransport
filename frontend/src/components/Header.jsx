import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getToken, clearToken } from '../utils/auth';

export default function Header() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const token = getToken();

  function handleLogout() {
    clearToken();
    nav('/');
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logos/logo.png" alt="HuteFast" className="h-10 w-10 rounded" />
          <span className="text-xl font-bold text-primary">HuteFast</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-primary">
            Home
          </Link>
          <Link to="/book" className="text-gray-700 hover:text-primary">
            Book Trip
          </Link>
          <a href="#about" className="text-gray-700 hover:text-primary">
            About Us
          </a>
          <a href="#contact" className="text-gray-700 hover:text-primary">
            Contact Us
          </a>

          {/* Language Switcher */}
          <div className="relative group">
            <button className="text-gray-700 hover:text-primary flex items-center gap-1">
              🌐 {i18n.language.toUpperCase()}
            </button>
            <div className="absolute hidden group-hover:block bg-white shadow-md rounded mt-2 py-2 min-w-max">
              <button
                onClick={() => i18n.changeLanguage('en')}
                className="block w-full text-left px-4 py-1 hover:bg-gray-100"
              >
                English
              </button>
              <button
                onClick={() => i18n.changeLanguage('fr')}
                className="block w-full text-left px-4 py-1 hover:bg-gray-100"
              >
                Français
              </button>
            </div>
          </div>

          {/* Auth Buttons */}
          {token ? (
            <div className="flex gap-2 items-center">
              <Link to="/admin/login" className="text-gray-700 hover:text-primary text-sm">
                👨‍💼 Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="text-primary border border-primary px-4 py-2 rounded hover:bg-primary hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t p-4 space-y-3">
          <Link to="/" className="block text-gray-700 hover:text-primary">
            Home
          </Link>
          <Link to="/book" className="block text-gray-700 hover:text-primary">
            Book Trip
          </Link>
          <a href="#about" className="block text-gray-700 hover:text-primary">
            About Us
          </a>
          <a href="#contact" className="block text-gray-700 hover:text-primary">
            Contact Us
          </a>

          <div className="border-t pt-2">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className="block w-full text-left py-2 text-gray-700 hover:text-primary"
            >
              English
            </button>
            <button
              onClick={() => i18n.changeLanguage('fr')}
              className="block w-full text-left py-2 text-gray-700 hover:text-primary"
            >
              Français
            </button>
          </div>

          {token ? (
            <div className="space-y-2 border-t pt-2">
              <Link to="/admin/login" className="block text-gray-700 hover:text-primary">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2 border-t pt-2">
              <Link to="/login" className="flex-1 text-center text-primary border border-primary px-3 py-2 rounded">
                Sign In
              </Link>
              <Link to="/register" className="flex-1 text-center bg-primary text-white px-3 py-2 rounded">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
