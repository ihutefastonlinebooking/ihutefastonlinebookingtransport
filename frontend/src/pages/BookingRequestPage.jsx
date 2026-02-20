import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Alert } from '../components';
import { apiService } from '../services/api';
import { toast } from 'react-toastify';

export const BookingRequestPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    originCity: '',
    destinationCity: '',
    departureDate: '',
    returnDate: '',
    numberOfPassengers: 1,
    vehicleType: '',
    specialRequirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Submit booking request to admin
      await apiService.post('/booking-requests', formData);
      setSubmitted(true);
      toast.success(t('booking.requestSubmitted', 'Booking request submitted successfully!'));
    } catch (err) {
      setError(err?.response?.data?.message || t('errors.somethingWentWrong', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            {t('booking.requestSubmitted', 'Request Submitted!')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('booking.requestSubmittedDesc', 'Your booking request has been submitted. Our team will contact you soon.')}
          </p>
          <Button onClick={() => window.location.href = '/'} variant="primary">
            {t('common.back', 'Back to Home')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('booking.bookYourTrip', 'Book Your Trip')}
          </h1>
          <p className="text-white text-opacity-90">
            {t('booking.fillFormDesc', 'Fill out this form and our team will contact you with booking details.')}
          </p>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            {t('booking.tripDetails', 'Trip Details')}
          </h2>

          {error && <Alert variant="error" message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('common.fullName', 'Full Name')}
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t('common.fullName', 'Enter your full name')}
              required
            />

            <Input
              label={t('common.email', 'Email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('common.email', 'Enter your email')}
              required
            />

            <Input
              label={t('common.phone', 'Phone')}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('common.phone', 'Enter your phone number')}
              required
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label={t('booking.fromCity', 'From')}
                type="text"
                name="originCity"
                value={formData.originCity}
                onChange={handleChange}
                placeholder={t('booking.fromCity', 'Departure city')}
                required
              />
              <Input
                label={t('booking.toCity', 'To')}
                type="text"
                name="destinationCity"
                value={formData.destinationCity}
                onChange={handleChange}
                placeholder={t('booking.toCity', 'Destination city')}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label={t('booking.departureDate', 'Departure Date')}
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={handleChange}
                required
              />
              <Input
                label={t('booking.returnDate', 'Return Date (Optional)')}
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('booking.numberOfPassengers', 'Number of Passengers')}
                </label>
                <select
                  name="numberOfPassengers"
                  value={formData.numberOfPassengers}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('booking.vehicleType', 'Preferred Vehicle Type')}
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">{t('common.any', 'Any')}</option>
                  <option value="bus">{t('booking.bus', 'Bus')}</option>
                  <option value="minibus">{t('booking.minibus', 'Minibus')}</option>
                  <option value="van">{t('booking.van', 'Van')}</option>
                  <option value="car">{t('booking.car', 'Car')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('booking.specialRequirements', 'Special Requirements (Optional)')}
              </label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                placeholder={t('booking.specialRequirementsPlaceholder', 'Any special requests or notes...')}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? t('common.loading', 'Submitting...') : t('booking.submitRequest', 'Submit Booking Request')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default BookingRequestPage;