import React from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Spinner, Loader, Header, Button, Card } from '../components';
import { getAccessToken } from '../utils/auth';

const STEPS = [
  { id: 1, name: 'Service', icon: '🚌' },
  { id: 2, name: 'Date', icon: '📅' },
  { id: 3, name: 'Time', icon: '⏰' },
  { id: 4, name: 'Details', icon: '👤' },
  { id: 5, name: 'Confirm', icon: '✓' }
];

export default function BookingFlow() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Step 1: Service Selection
  const [routes, setRoutes] = React.useState([]);
  const [selectedRoute, setSelectedRoute] = React.useState(null);
  const [searchOrigin, setSearchOrigin] = React.useState('');
  const [searchDest, setSearchDest] = React.useState('');

  // Step 2: Date Selection  
  const [selectedDate, setSelectedDate] = React.useState('');

  // Step 3: Time Selection
  const [availableTimes, setAvailableTimes] = React.useState([]);
  const [selectedTime, setSelectedTime] = React.useState('');
  const [numberOfSeats, setNumberOfSeats] = React.useState(1);

  // Step 4: Customer Details
  const [passengerNames, setPassengerNames] = React.useState(['']);
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');

  // Step 5: Confirmation
  const [bookingData, setBookingData] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingRef, setBookingRef] = React.useState('');
  const qrCanvasRef = React.useRef();

  // Step 1: Search and select service
  const handleSearchServices = async (e) => {
    e.preventDefault();
    if (!searchOrigin || !searchDest) {
      toast.error('Please enter both origin and destination');
      return;
    }
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await axios.get('/api/v1/bookings/search', {
        params: { origin: searchOrigin, destination: searchDest },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoutes(response.data.data || []);
      if (!response.data.data || response.data.data.length === 0) {
        toast.info('No routes found for this route');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to search routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (route) => {
    setSelectedRoute(route);
    setCurrentStep(2);
  };

  // Step 2: Select date
  const handleSelectDate = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    // Get available times for selected route and date
    setAvailableTimes(generateTimeSlots(selectedRoute?.departure_time));
    setCurrentStep(3);
  };

  // Helper: Generate time slots
  const generateTimeSlots = (baseTime) => {
    if (!baseTime) return [];
    const slots = [];
    const [hour, minute] = baseTime.split(':').map(Number);
    for (let i = 0; i < 5; i++) {
      let h = hour + i;
      let m = minute;
      if (h >= 24) h -= 24;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return slots;
  };

  // Step 3: Select time
  const handleSelectTime = () => {
    if (!selectedTime) {
      toast.error('Please select a time');
      return;
    }
    if (numberOfSeats < 1 || numberOfSeats > 8) {
      toast.error('Please select valid number of seats (1-8)');
      return;
    }
    setPassengerNames(Array(numberOfSeats).fill(''));
    setCurrentStep(4);
  };

  // Step 4: Enter customer details
  const handleUpdatePassenger = (idx, name) => {
    const updated = [...passengerNames];
    updated[idx] = name;
    setPassengerNames(updated);
  };

  const handleProceedToConfirm = () => {
    if (!customerEmail || !customerPhone) {
      toast.error('Please enter email and phone');
      return;
    }
    if (passengerNames.some(n => !n.trim())) {
      toast.error('Please enter all passenger names');
      return;
    }
    setCurrentStep(5);
  };

  // Step 5: Confirm booking
  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const token = getAccessToken();
      const response = await axios.post(
        '/api/v1/bookings',
        {
          routeId: selectedRoute.id,
          departureDate: selectedDate,
          departureTime: selectedTime,
          numberOfSeats: numberOfSeats,
          passengerNames: passengerNames,
          customerEmail: customerEmail,
          customerPhone: customerPhone
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = response.data.data;
      setBookingRef(booking.bookingReference || booking.booking_ref);
      setBookingData(booking);

      // Generate QR code
      if (qrCanvasRef.current && booking.bookingReference) {
        QRCode.toCanvas(qrCanvasRef.current, booking.bookingReference, { width: 256 });
      }

      toast.success('Booking confirmed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  // ===== RENDER COMPONENTS =====

  const StepIndicator = ({ currentStep }) => (
    <div className="flex justify-between items-center mb-8">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className={`flex flex-col items-center cursor-pointer ${currentStep >= step.id ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
              currentStep === step.id
                ? 'bg-primary text-white scale-110'
                : currentStep > step.id
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > step.id ? '✓' : step.icon}
            </div>
            <span className="text-xs mt-2 font-semibold">{step.name}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-1 mx-2 transition-colors ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const Step1_Services = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Select Your Trip</h2>
      <form onSubmit={handleSearchServices} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2">From</label>
            <input
              type="text"
              placeholder="e.g., Kigali"
              value={searchOrigin}
              onChange={(e) => setSearchOrigin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">To</label>
            <input
              type="text"
              placeholder="e.g., Musanze"
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
            >
              Search
            </Button>
          </div>
        </div>
      </form>

      {loading && <Loader message="Searching routes..." />}

      {routes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-4">Available Routes:</h3>
          {routes.map((route) => (
            <div
              key={route.id}
              onClick={() => handleSelectService(route)}
              className="p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{route.origin_city} → {route.destination_city}</p>
                  <p className="text-sm text-gray-600">{route.company_name}</p>
                  <p className="text-xs text-gray-500">⏱️ {route.duration_hours}h | 📍 {route.distance_km}km</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold text-lg">RWF {route.price_per_seat?.toLocaleString()}</p>
                  {route.discount_percentage > 0 && (
                    <p className="text-green-600 text-sm font-semibold">{route.discount_percentage}% OFF</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  const Step2_Date = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Departure Date</h2>
      <p className="text-gray-600 mb-6">
        {selectedRoute?.origin_city} → {selectedRoute?.destination_city}
      </p>
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Departure Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      <div className="flex gap-4">
        <Button variant="secondary" onClick={goBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSelectDate} className="flex-1">
          Continue
        </Button>
      </div>
    </Card>
  );

  const Step3_Time = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Time & Seats</h2>
      <p className="text-gray-600 mb-6">
        {selectedRoute?.origin_city} → {selectedRoute?.destination_city} | {new Date(selectedDate).toLocaleDateString()}
      </p>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3">Available Departure Times:</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {availableTimes.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                selectedTime === time
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Number of Seats:</label>
        <select
          value={numberOfSeats}
          onChange={(e) => setNumberOfSeats(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <p className="text-lg font-bold mb-6">
        Total: RWF {((selectedRoute?.price_per_seat || 0) * numberOfSeats).toLocaleString()}
      </p>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={goBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSelectTime} className="flex-1">
          Continue
        </Button>
      </div>
    </Card>
  );

  const Step4_Details = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Contact Details & Passengers</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="font-semibold">Booking Summary:</p>
        <p className="text-sm text-gray-600 mt-2">
          {selectedRoute?.origin_city} → {selectedRoute?.destination_city} | {selectedDate} at {selectedTime} | {numberOfSeats} seat{numberOfSeats > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Email Address</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Phone Number</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+250..."
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Passenger Details:</h3>
        <div className="space-y-3">
          {passengerNames.map((name, idx) => (
            <div key={idx}>
              <label className="block text-sm font-semibold mb-1">Passenger {idx + 1} Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleUpdatePassenger(idx, e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={goBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleProceedToConfirm} className="flex-1">
          Review Booking
        </Button>
      </div>
    </Card>
  );

  const Step5_Confirm = () => (
    <Card className="p-6">
      {!bookingData ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Confirm Your Booking</h2>

          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <h3 className="font-semibold mb-3">Booking Summary:</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Route:</strong> {selectedRoute?.origin_city} → {selectedRoute?.destination_city}</p>
              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Seats:</strong> {numberOfSeats}</p>
              <p><strong>Total Price:</strong> RWF {((selectedRoute?.price_per_seat || 0) * numberOfSeats).toLocaleString()}</p>
              <p><strong>Contact:</strong> {customerEmail} | {customerPhone}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <h3 className="font-semibold mb-2">Passengers:</h3>
            <ul className="text-sm space-y-1">
              {passengerNames.map((name, idx) => (
                <li key={idx}>• {idx + 1}. {name}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg mb-6 text-sm">
            <p className="font-semibold mb-1">📌 Important:</p>
            <p>After confirming, you'll need to complete payment within 10 minutes. Your booking reference and QR code will be sent to your email.</p>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={goBack} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleConfirmBooking}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Confirm & Pay
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4 text-green-600">Booking Confirmed!</h2>

          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Your Booking Reference:</p>
            <p className="text-2xl font-bold text-primary">{bookingRef}</p>
          </div>

          {qrCanvasRef && (
            <div className="mb-6 flex justify-center">
              <canvas ref={qrCanvasRef}></canvas>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold mb-2">📧 Confirmation Details:</p>
            <p className="text-gray-600">Your ticket and QR code have been sent to:</p>
            <p className="font-semibold text-primary">{customerEmail}</p>
          </div>

          <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
            Go to My Bookings
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <ToastContainer />
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <StepIndicator currentStep={currentStep} />
          </div>

          {currentStep === 1 && <Step1_Services />}
          {currentStep === 2 && <Step2_Date />}
          {currentStep === 3 && <Step3_Time />}
          {currentStep === 4 && <Step4_Details />}
          {currentStep === 5 && <Step5_Confirm />}
        </div>
      </div>
    </>
  );
}
