import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components';
import Carousel from '../components/Carousel';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <Carousel />
      </header>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose HuteFast?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚗</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Reliable Trips</h3>
              <p className="text-gray-600">Safe, comfortable, and on-time transportation</p>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Affordable Prices</h3>
              <p className="text-gray-600">Competitive rates with no hidden charges</p>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
              <p className="text-gray-600">Book in seconds with our mobile-friendly app</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-secondary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Travel?</h2>
          <p className="text-lg mb-8 text-opacity-90">Join thousands of satisfied customers using HuteFast</p>
          <Link to="/register">
            <Button variant="warning" size="lg">
              Book Your Trip Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
