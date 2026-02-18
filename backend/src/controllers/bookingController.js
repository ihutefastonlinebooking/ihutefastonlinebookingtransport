import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, bookingValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import QRCodeService from '../services/QRCodeService.js';
import SMSService from '../services/SMSService.js';
import EmailService from '../services/EmailService.js';

const qrService = new QRCodeService();
const emailService = new EmailService();

// Lazy initialization of SMS service
let smsService = null;
const getSmsService = () => {
  if (!smsService) {
    smsService = new SMSService();
  }
  return smsService;
};

export class BookingController {
  async searchRoutes(req, res, next) {
    try {
      const validatedData = validate(bookingValidationSchemas.search, req.body);

      const result = await query(
        `SELECT r.*, c.name as company_name FROM routes r
         JOIN companies c ON r.company_id = c.id
         WHERE LOWER(r.origin_city) = LOWER($1)
         AND LOWER(r.destination_city) = LOWER($2)
         AND r.status = 'active'
         AND r.route_type = 'long_distance'
         ORDER BY r.price_per_seat ASC`,
        [validatedData.originCity, validatedData.destinationCity]
      );

      res.json(apiResponse.success(result.rows, 'Routes found'));
    } catch (error) {
      next(error);
    }
  }

  async createBooking(req, res, next) {
    try {
      const validatedData = validate(bookingValidationSchemas.create, req.body);
      
      // Get route details
      const routeResult = await query(
        'SELECT * FROM routes WHERE id = $1 AND status = $2',
        [validatedData.routeId, 'active']
      );

      if (routeResult.rows.length === 0) {
        throw errors.notFound('Route not found or no longer active');
      }

      const route = routeResult.rows[0];

      // Check vehicle availability
      const vehicleResult = await query(
        `SELECT v.* FROM vehicles v
         JOIN routes r ON v.company_id = r.company_id
         WHERE r.id = $1 AND v.seats_capacity >= $2`,
        [validatedData.routeId, validatedData.numberOfSeats]
      );

      if (vehicleResult.rows.length === 0) {
        throw errors.badRequest('No vehicle available with sufficient seats');
      }

      const vehicle = vehicleResult.rows[0];

      // Calculate price
      const subtotal = route.price_per_seat * validatedData.numberOfSeats;
      const discount = (subtotal * route.discount_percentage) / 100;
      const taxAmount = (subtotal - discount) * 0.18;
      const totalPrice = subtotal - discount + taxAmount;

      // Create booking
      const bookingRef = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const bookingId = uuidv4();
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10); // 10-minute expiry

      const bookingResult = await query(
        `INSERT INTO bookings 
         (id, route_id, user_id, vehicle_id, booking_reference, number_of_seats, total_price, status, payment_status, departure_date, passenger_names, expiry_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          bookingId,
          validatedData.routeId,
          req.user.userId,
          vehicle.id,
          bookingRef,
          validatedData.numberOfSeats,
          totalPrice,
          'pending',
          'unpaid',
          validatedData.departureDate,
          JSON.stringify(validatedData.passengerNames),
          expiryTime,
        ]
      );

      const booking = bookingResult.rows[0];

      // Generate QR code
      const qrCode = await qrService.generateBookingQRCode(booking.id, bookingRef, req.user.userId, validatedData.routeId);

      // Update booking with QR code
      await query('UPDATE bookings SET qr_code_data = $1 WHERE id = $2', [qrCode, booking.id]);

      await auditLog(req.user.userId, 'BOOKING_CREATED', 'booking', booking.id, null, booking, 'success');

      res.status(201).json(apiResponse.success(
        {
          bookingId: booking.id,
          bookingReference: bookingRef,
          totalPrice: totalPrice,
          status: 'pending',
          expiresAt: expiryTime,
          qrCode: qrCode,
        },
        'Booking created successfully. Complete payment within 10 minutes.',
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  async getBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      const result = await query(
        'SELECT * FROM bookings WHERE id = $1',
        [bookingId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = result.rows[0];

      // Check authorization
      if (booking.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('You do not have access to this booking');
      }

      res.json(apiResponse.success(booking, 'Booking retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async getUserBookings(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query_text = 'SELECT * FROM bookings WHERE user_id = $1';
      let params = [req.user.userId];

      if (status) {
        query_text += ' AND status = $2';
        params.push(status);
      }

      query_text += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await query(query_text, params);

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM bookings WHERE user_id = $1',
        [req.user.userId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      const result = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);

      if (result.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = result.rows[0];

      if (booking.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('You cannot cancel this booking');
      }

      if (booking.status === 'completed' || booking.status === 'cancelled') {
        throw errors.badRequest(`Cannot cancel booking with status: ${booking.status}`);
      }

      // Calculate refund (full refund before 24 hours, 50% after)
      const departureDate = new Date(booking.departure_date);
      const hoursUntilDeparture = (departureDate - new Date()) / (1000 * 60 * 60);
      const refundPercentage = hoursUntilDeparture > 24 ? 100 : 50;
      const refundAmount = booking.total_price * (refundPercentage / 100);

      // Update booking
      await query(
        'UPDATE bookings SET status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['cancelled', 'refunded', bookingId]
      );

      await auditLog(req.user.userId, 'BOOKING_CANCELLED', 'booking', bookingId, booking, null, 'success');

      res.json(apiResponse.success(
        {
          bookingId: bookingId,
          status: 'cancelled',
          refundAmount: refundAmount,
          refundPercentage: refundPercentage,
        },
        'Booking cancelled successfully'
      ));
    } catch (error) {
      next(error);
    }
  }
}

export default BookingController;
