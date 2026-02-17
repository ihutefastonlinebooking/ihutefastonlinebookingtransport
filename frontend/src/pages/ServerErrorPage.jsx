import React from 'react';
import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
        <p className="text-2xl font-bold mb-2">Server Error</p>
        <p className="text-gray-600 mb-8">Something went wrong on our end. Please try again later.</p>
        <div className="space-x-4">
          <Link to="/" className="bg-primary text-white px-6 py-2 rounded hover:bg-opacity-90">
            Go Home
          </Link>
          <button onClick={() => window.location.reload()} className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
