import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components';
import Carousel from '../components/Carousel';
import Header from '../components/Header';

export const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Carousel />

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
              <p className="text-gray-600">Safe, comfortable, and on-time transportation across Rwanda</p>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Affordable Prices</h3>
              <p className="text-gray-600">Competitive rates with transparent pricing and no hidden charges</p>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
              <p className="text-gray-600">Book in seconds with our mobile-friendly platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div id="about" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">About HuteFast</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 mb-4">
                HuteFast is Rwanda's leading transport booking platform. We connect passengers with reliable transport operators across the country.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                With our innovative QR-based ticketing system and real-time tracking, we ensure safe, transparent, and convenient travel for everyone.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Founded in 2024, HuteFast is committed to modernizing transport in Rwanda with technology and customer service excellence.
              </p>
              <Link to="/book" className="inline-block bg-primary text-white px-8 py-3 rounded font-bold hover:bg-opacity-90">
                Book Your Trip Now
              </Link>
            </div>
            <div className="bg-primary bg-opacity-10 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-2">Serving Rwanda</h3>
              <p className="text-gray-700 mb-4">Connecting all major cities and towns across the country</p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div>
                  <p className="text-2xl font-bold text-primary">5000+</p>
                  <p className="text-sm text-gray-600">Monthly Trips</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">50+</p>
                  <p className="text-sm text-gray-600">Transport Partners</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">100%</p>
                  <p className="text-sm text-gray-600">Safe Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <div id="contact" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
                📧
              </div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:support@hutefast.com" className="hover:text-primary">
                  support@hutefast.com
                </a>
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
                📱
              </div>
              <h3 className="text-xl font-bold mb-2">Phone</h3>
              <p className="text-gray-600">
                <a href="tel:+250788000000" className="hover:text-primary">
                  +250 788 000 000
                </a>
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
                📍
              </div>
              <h3 className="text-xl font-bold mb-2">Location</h3>
              <p className="text-gray-600">
                Kigali, Rwanda
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="mt-12 max-w-2xl mx-auto bg-gray-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
            <form className="space-y-4">
              <div>
                <label className="block font-bold mb-2">Full Name</label>
                <input type="text" placeholder="Your name" className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="block font-bold mb-2">Email</label>
                <input type="email" placeholder="your@email.com" className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="block font-bold mb-2">Message</label>
                <textarea placeholder="Your message" rows="5" className="w-full p-3 border rounded"></textarea>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-3 rounded font-bold hover:bg-opacity-90">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Travel?</h2>
          <p className="text-lg mb-8 text-opacity-90">Join thousands of satisfied customers using HuteFast</p>
          <Link to="/book">
            <Button variant="warning" size="lg">
              Book Your Trip Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About HuteFast</h4>
              <p className="text-gray-400 text-sm">Leading transport booking platform in Rwanda</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/book" className="hover:text-white">Book Trip</Link></li>
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow Us</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 HuteFast. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
