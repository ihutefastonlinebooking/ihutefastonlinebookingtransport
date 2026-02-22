import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function LanguageDropdown({ className = '' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState('en');

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage') || i18n.language || 'en';
    setCurrent(saved);
    if (saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);
    setCurrent(code);
    setOpen(false);
  };

  const currentLang = languages.find(l => l.code === current) || languages[0];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-max">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors ${
                lang.code === current ? 'bg-primary/10 text-primary font-semibold' : ''
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === current && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
