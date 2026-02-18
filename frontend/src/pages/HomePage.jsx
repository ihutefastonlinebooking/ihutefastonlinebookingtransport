import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components';
import Carousel from '../components/Carousel';
import Header from '../components/Header';

export const HomePage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <Header />
      <Carousel />

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">{t('home.whyChooseUs', 'Why Choose EHUT?')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚗</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.reliableTrips', 'Reliable Trips')}</h3>
              <p className="text-gray-600">{t('home.reliableTripsDesc', 'Safe, comfortable, and on-time transportation across Rwanda')}</p>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.affordablePrices', 'Affordable Prices')}</h3>
              <p className="text-gray-600">{t('home.affordablePricesDesc', 'Competitive rates with transparent pricing and no hidden charges')}</p>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.easyBooking', 'Easy Booking')}</h3>
              <p className="text-gray-600">{t('home.easyBookingDesc', 'Book in seconds with our mobile-friendly platform')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div id="about" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">{t('home.aboutHutefast', 'About EHUT')}</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 mb-4">
                {t('home.aboutDesc1', 'EHUT is Rwanda\'s leading transport booking platform. We connect passengers with reliable transport operators across the country.')}
              </p>
              <p className="text-lg text-gray-700 mb-4">
                {t('home.aboutDesc2', 'With our innovative QR-based ticketing system and real-time tracking, we ensure safe, transparent, and convenient travel for everyone.')}
              </p>
              <p className="text-lg text-gray-700 mb-6">
                {t('home.aboutDesc3', 'Founded in 2024, EHUT is committed to modernizing transport in Rwanda with technology and customer service excellence.')}
              </p>
              <Link to="/book" className="inline-block bg-primary text-white px-8 py-3 rounded font-bold hover:bg-opacity-90">
                {t('booking.bookNow', 'Book Your Trip Now')}
              </Link>
            </div>
            <div className="bg-primary bg-opacity-10 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-2">{t('home.servingRwanda', 'Serving Rwanda')}</h3>
              <p className="text-gray-700 mb-4">{t('home.servingDesc', 'Connecting all major cities and towns across the country')}</p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div>
                  <p className="text-2xl font-bold text-primary">5000+</p>
                  <p className="text-sm text-gray-600">{t('home.monthlyTrips', 'Monthly Trips')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">50+</p>
                  <p className="text-sm text-gray-600">{t('home.transportPartners', 'Transport Partners')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">100%</p>
                  <p className="text-sm text-gray-600">{t('home.safeVerified', 'Safe Verified')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <div id="contact" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">{t('home.contactUs', 'Contact Us')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
                📧
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.email', 'Email')}</h3>
              <p className="text-gray-600">
                <a href="mailto:support@ehut.com" className="hover:text-primary">
                  support@ehut.com
                </a>
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
                📱
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.phone', 'Phone')}</h3>
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
              <h3 className="text-xl font-bold mb-2">{t('home.location', 'Location')}</h3>
              <p className="text-gray-600">
                Kigali, Rwanda
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="mt-12 max-w-2xl mx-auto bg-gray-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-6">{t('home.sendMessage', 'Send us a Message')}</h3>
            <form className="space-y-4">
              <div>
                <label className="block font-bold mb-2">{t('home.fullName', 'Full Name')}</label>
                <input type="text" placeholder={t('home.yourName', 'Your name')} className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="block font-bold mb-2">{t('common.email', 'Email')}</label>
                <input type="email" placeholder={t('home.yourEmail', 'your@email.com')} className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="block font-bold mb-2">{t('home.yourMessage', 'Message')}</label>
                <textarea placeholder={t('home.yourMessage', 'Your message')} rows="5" className="w-full p-3 border rounded"></textarea>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-3 rounded font-bold hover:bg-opacity-90">
                {t('home.sendMessageBtn', 'Send Message')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('home.readyToTravel', 'Ready to Travel?')}</h2>
          <p className="text-lg mb-8 text-opacity-90">{t('home.joinThousands', 'Join thousands of satisfied customers using EHUT')}</p>
          <Link to="/book">
            <Button variant="warning" size="lg">
              {t('booking.bookNow', 'Book Your Trip Now')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">{t('home.aboutHutefastFooter', 'About EHUT')}</h4>
              <p className="text-gray-400 text-sm">{t('home.leadingPlatform', 'Leading transport booking platform in Rwanda')}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('home.quickLinks', 'Quick Links')}</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><Link to="/" className="hover:text-white">{t('common.home', 'Home')}</Link></li>
                <li><Link to="/book" className="hover:text-white">{t('booking.bookNow', 'Book Trip')}</Link></li>
                <li><a href="#about" className="hover:text-white">{t('common.aboutUs', 'About')}</a></li>
                <li><a href="#contact" className="hover:text-white">{t('home.contactUs', 'Contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('home.support', 'Support')}</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">{t('home.faq', 'FAQ')}</a></li>
                <li><a href="#" className="hover:text-white">{t('home.terms', 'Terms')}</a></li>
                <li><a href="#" className="hover:text-white">{t('home.privacy', 'Privacy')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('home.followUs', 'Follow Us')}</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>{t('home.copyright', '© 2026 EHUT. All rights reserved.')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
