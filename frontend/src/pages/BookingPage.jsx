import React from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Spinner, Loader } from '../components';
import QRCode from 'qrcode';

const PAYMENT_DEADLINE_MIN = 10;

export default function BookingPage() {
  const [step, setStep] = React.useState(1); // 1: Search, 2: Select Seats, 3: Passenger Names, 4: Confirm, 5: Success
  const [routes, setRoutes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Step 1: Search
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [departureDate, setDepartureDate] = React.useState('');

  // Step 2: Seat selection
  const [selectedRoute, setSelectedRoute] = React.useState(null);
  const [numberOfSeats, setNumberOfSeats] = React.useState(1);

  // Step 3: Passenger names
  const [passengerNames, setPassengerNames] = React.useState(['']);

  // Step 4: Confirmation & payment countdown
  const [timeLeft, setTimeLeft] = React.useState(PAYMENT_DEADLINE_MIN * 60);
  const [booking, setBooking] = React.useState(null);
  const [paymentProcessing, setPaymentProcessing] = React.useState(false);

  // Step 5: QR Code
  const [qrCode, setQrCode] = React.useState(null);
  const qrCanvasRef = React.useRef();

  // Search routes
  async function handleSearch(e) {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      return toast.error('Please fill in all search fields');
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/bookings/search', {
        originCity: origin,
        destinationCity: destination,
        departureDate,
      });
      setRoutes(res.data.data || []);
      if (res.data.data?.length === 0) toast.info('No routes found');
      else setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  // Select route and seats, move to passenger names
  function selectRoute(route) {
    setSelectedRoute(route);
    setStep(3);
  }

  // Update passenger name
  function updatePassenger(idx, name) {
    const copy = [...passengerNames];
    copy[idx] = name;
    setPassengerNames(copy);
  }

  // Add/remove passenger fields
  function addPassengerField() {
    if (passengerNames.length < numberOfSeats) {
      setPassengerNames([...passengerNames, '']);
    }
  }

  function removePassengerField(idx) {
    if (passengerNames.length > 1) {
      setPassengerNames(passengerNames.filter((_, i) => i !== idx));
    }
  }

  // Move to confirmation
  function handleContinueToPayment() {
    if (passengerNames.some(n => !n.trim())) {
      return toast.error('All passenger names are required');
    }
    if (passengerNames.length !== numberOfSeats) {
      return toast.error(`Please add exactly ${numberOfSeats} passenger names`);
    }
    setStep(4);
    setTimeLeft(PAYMENT_DEADLINE_MIN * 60);
  }

  // Create booking
  async function handleCreateBooking() {
    if (!selectedRoute) return toast.error('No route selected');
    setPaymentProcessing(true);
    try {
      const res = await axios.post('/api/bookings', {
        routeId: selectedRoute.id,
        numberOfSeats,
        departureDate,
        passengerNames,
      });
      const createdBooking = res.data.data;
      setBooking(createdBooking);
      const qrValue = createdBooking.booking_reference || 'BOOKING-' + createdBooking.id;
      setQrCode(qrValue);

      // Generate QR code canvas
      if (qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, qrValue, { width: 256 }, err => {
          if (err) console.error('QR generation failed:', err);
        });
      }

      toast.success('Booking created! Proceeding to payment...');
      // Start countdown
      setTimeLeft(PAYMENT_DEADLINE_MIN * 60);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally {
      setPaymentProcessing(false);
    }
  }

  // Payment countdown
  React.useEffect(() => {
    if (step !== 4 || !booking) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          toast.error('Payment window expired. Please create a new booking.');
          setStep(1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, booking]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <ToastContainer />
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Book Your Trip</h1>
          <div className="bg-white p-8 rounded shadow-md">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">From</label>
                <input
                  type="text"
                  placeholder="e.g., Kigali"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">To</label>
                <input
                  type="text"
                  placeholder="e.g., Musanze"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-primary text-white py-2 rounded" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {loading && <Loader message="Searching for routes..." className="mt-8" />}

          {routes.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4">
              <h2 className="text-2xl font-bold">Available Routes</h2>
              {routes.map(route => (
                <div key={route.id} className="bg-white p-6 rounded shadow-md hover:shadow-lg cursor-pointer" onClick={() => selectRoute(route)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{route.origin_city} → {route.destination_city}</h3>
                      <p className="text-gray-600">{route.company_name}</p>
                      <p className="text-sm text-gray-500">Duration: {route.duration_hours}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">RWF {route.price_per_seat?.toLocaleString()}</p>
                      <p className="text-sm text-green-600">{route.discount_percentage}% discount</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 2 || step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <ToastContainer />
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <div className="text-center">
                <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto">1</div>
                <p className="text-sm mt-2">Search</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-center">
                <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto">2</div>
                <p className="text-sm mt-2">Seats</p>
              </div>
            </div>
            <div className="flex-1">
              <div className={`text-center ${step === 3 ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`${step === 3 ? 'bg-primary' : 'bg-gray-300'} text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto`}>3</div>
                <p className="text-sm mt-2">Details</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-center opacity-50">
                <div className="bg-gray-300 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto">4</div>
                <p className="text-sm mt-2">Pay</p>
              </div>
            </div>
          </div>

          {step === 2 && selectedRoute && (
            <div className="bg-white p-8 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-6">{selectedRoute.origin_city} → {selectedRoute.destination_city}</h2>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Number of Seats</label>
                <select value={numberOfSeats} onChange={e => setNumberOfSeats(parseInt(e.target.value))} className="p-2 border rounded w-full md:w-48">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setStep(3)} className="bg-primary text-white px-6 py-2 rounded">
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-8 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-6">Passenger Details</h2>
              <div className="space-y-4">
                {passengerNames.map((name, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Passenger {idx + 1} Name</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={e => updatePassenger(idx, e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {passengerNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassengerField(idx)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {passengerNames.length < numberOfSeats && (
                <button
                  type="button"
                  onClick={addPassengerField}
                  className="mt-4 bg-secondary text-white px-4 py-2 rounded"
                >
                  Add Passenger
                </button>
              )}
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(2)} className="bg-gray-300 text-black px-6 py-2 rounded">
                  Back
                </button>
                <button onClick={handleContinueToPayment} className="bg-primary text-white px-6 py-2 rounded">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <ToastContainer />
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold">Complete Payment</h1>
            <div className={`mt-4 text-3xl font-bold ${timeLeft < 120 ? 'text-red-600' : 'text-primary'}`}>
              {minutes}:{seconds < 10 ? '0' : ''}{seconds}
            </div>
            <p className="text-gray-600 mt-2">Payment window expires in {minutes} minutes</p>
          </div>

          {!booking && (
            <div className="bg-white p-8 rounded shadow-md text-center mb-8">
              <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>
              <div className="text-left space-y-2 mb-6">
                <p><strong>Route:</strong> {selectedRoute?.origin_city} → {selectedRoute?.destination_city}</p>
                <p><strong>Seats:</strong> {numberOfSeats}</p>
                <p><strong>Total Price:</strong> RWF {(selectedRoute?.price_per_seat * numberOfSeats)?.toLocaleString()}</p>
              </div>
              <button
                onClick={handleCreateBooking}
                className="bg-primary text-white px-8 py-3 rounded text-lg font-bold"
                disabled={paymentProcessing}
              >
                {paymentProcessing ? 'Processing...' : 'Create Booking & Pay'}
              </button>
            </div>
          )}

          {booking && (
            <div className="bg-white p-8 rounded shadow-md text-center">
              <h2 className="text-2xl font-bold mb-6">Booking Confirmation</h2>
              <p><strong>Booking Reference:</strong> {booking.booking_reference}</p>
              <p className="mt-4 font-bold">Please scan this QR code or use reference to complete payment:</p>
              {qrCode && (
                <div className="flex justify-center my-6">
                  <canvas ref={qrCanvasRef}></canvas>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-6">Your ticket QR code will be sent to your email and SMS shortly.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
