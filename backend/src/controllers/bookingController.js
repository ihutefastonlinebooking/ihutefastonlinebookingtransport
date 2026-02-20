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
  // Search routes - improved with query params
  async searchRoutes(req, res, next) {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        throw errors.badRequest('Origin and destination are required');
      }

      const result = await query(
        `SELECT r.*, c.name as company_name FROM routes r
         JOIN companies c ON r.company_id = c.id
         WHERE LOWER(r.origin_city) = LOWER($1)
         AND LOWER(r.destination_city) = LOWER($2)
         AND r.status = 'active'
         ORDER BY r.price_per_seat ASC`,
        [origin, destination]
      );

      res.json(apiResponse.success(result.rows, 'Routes found'));
    } catch (error) {
      next(error);
    }
  }

  // Check availability for a specific route and date
  async checkAvailability(req, res, next) {
    try {
      const { routeId, departureDate, numberOfSeats } = req.query;

      if (!routeId || !departureDate || !numberOfSeats) {
        throw errors.badRequest('routeId, departureDate, and numberOfSeats are required');
      }

      // Get route info
      const routeResult = await query(
        'SELECT * FROM routes WHERE id = $1 AND status = $2',
        [routeId, 'active']
      );

      if (routeResult.rows.length === 0) {
        throw errors.notFound('Route not found');
      }

      // Check available seats (total capacity - already booked)
      const bookedResult = await query(
        `SELECT COALESCE(SUM(number_of_seats), 0) as booked FROM bookings
         WHERE route_id = $1
         AND departure_date = $2
         AND status IN ('confirmed', 'boarded')`,
        [routeId, departureDate]
      );

      const vehicle = routeResult.rows[0];
      const bookedSeats = parseInt(bookedResult.rows[0].booked);
      const availableSeats = vehicle.seats_capacity - bookedSeats;

      res.json(apiResponse.success({
        routeId,
        departureDate,
        availableSeats,
        requestedSeats: numberOfSeats,
        isAvailable: availableSeats >= numberOfSeats
      }, 'Availability checked'));
    } catch (error) {
      next(error);
    }
  }

  // Create booking - with double-booking prevention
  async createBooking(req, res, next) {
    try {
      const { routeId, departureDate, departureTime, numberOfSeats, passengerNames, customerEmail, customerPhone } = req.body;

      // Validation
      if (!routeId || !departureDate || !numberOfSeats || !passengerNames || !customerEmail) {
        throw errors.badRequest('Missing required fields');
      }

      if (numberOfSeats < 1 || numberOfSeats > 8) {
        throw errors.badRequest('Number of seats must be between 1 and 8');
      }

      if (passengerNames.length !== numberOfSeats || passengerNames.some(n => !n.trim())) {
        throw errors.badRequest('All passenger names are required');
      }

      // Get route details
      const routeResult = await query(
        'SELECT * FROM routes WHERE id = $1 AND status = $2',
        [routeId, 'active']
      );

      if (routeResult.rows.length === 0) {
        throw errors.notFound('Route not found or no longer active');
      }

      const route = routeResult.rows[0];

      // Get vehicle
      const vehicleResult = await query(
        `SELECT v.* FROM vehicles v
         JOIN routes r ON v.company_id = r.company_id
         WHERE r.id = $1 AND v.status = 'active'
         LIMIT 1`,
        [routeId]
      );

      if (vehicleResult.rows.length === 0) {
        throw errors.badRequest('No vehicle available for this route');
      }

      const vehicle = vehicleResult.rows[0];

      // Check for double-booking - lock and check
      const bookedResult = await query(
        `SELECT COALESCE(SUM(number_of_seats), 0) as booked FROM bookings
         WHERE route_id = $1
         AND departure_date = $2
         AND status IN ('confirmed', 'boarded', 'pending')
         FOR UPDATE`,
        [routeId, departureDate]
      );

      const bookedSeats = parseInt(bookedResult.rows[0].booked);
      if (bookedSeats + numberOfSeats > vehicle.seats_capacity) {
        throw errors.badRequest(`Only ${vehicle.seats_capacity - bookedSeats} seats available for this date`);
      }

      // Calculate price
      const subtotal = route.price_per_seat * numberOfSeats;
      const discount = (subtotal * route.discount_percentage) / 100;
      const taxAmount = (subtotal - discount) * 0.18;
      const totalPrice = subtotal - discount + taxAmount;

      // Create booking
      const bookingRef = `EHUT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const bookingId = uuidv4();

      const bookingResult = await query(
        `INSERT INTO bookings 
         (id, route_id, user_id, vehicle_id, booking_reference, number_of_seats, total_price, status, payment_status, departure_date, passenger_names, passenger_contacts, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          bookingId,
          routeId,
          req.user.userId,
          vehicle.id,
          bookingRef,
          numberOfSeats,
          totalPrice,
          'pending', // initial status
          'unpaid',
          departureDate,
          JSON.stringify(passengerNames),
          JSON.stringify(customerPhone ? [customerPhone] : []),
          `Email: ${customerEmail}`
        ]
      );

      const booking = bookingResult.rows[0];

      // Generate QR code for ticket
      let qrCode = bookingRef;
      try {
        qrCode = await qrService.generateBookingQRCode(bookingId, bookingRef, req.user.userId, routeId);
      } catch (err) {
        console.warn('QR code generation warning:', err);
      }

      // Send confirmation email
      try {
        await emailService.sendBookingConfirmation(customerEmail, {
          bookingRef,
          route: `${route.origin_city} → ${route.destination_city}`,
          date: departureDate,
          time: departureTime || route.departure_time,
          totalPrice,
          passengerCount: numberOfSeats,
          qrCode
        });
      } catch (err) {
        console.warn('Email sending warning:', err);
      }

      await auditLog(req.user.userId, 'BOOKING_CREATED', 'booking', bookingId, null, booking, 'success');

      res.status(201).json(apiResponse.success(
        {
          bookingId: booking.id,
          bookingReference: bookingRef,
          totalPrice,
          subtotal,
          discount,
          tax: taxAmount,
          status: 'pending',
          paymentStatus: 'unpaid',
          qrCode
        },
        'Booking created successfully',
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

  // ==== ADMIN METHODS ====

  // Get all bookings (admin only)
  async getAllBookings(req, res, next) {
    try {
      const { page = 1, limit = 20, status, userId, routeId, date } = req.query;
      const offset = (page - 1) * limit;

      let query_text = `SELECT b.*, r.origin_city, r.destination_city, u.email, u.first_name, u.last_name
                        FROM bookings b
                        JOIN routes r ON b.route_id = r.id
                        JOIN users u ON b.user_id = u.id
                        WHERE 1=1`;
      let params = [];

      if (status) {
        query_text += ` AND b.status = $${params.length + 1}`;
        params.push(status);
      }

      if (userId) {
        query_text += ` AND b.user_id = $${params.length + 1}`;
        params.push(userId);
      }

      if (routeId) {
        query_text += ` AND b.route_id = $${params.length + 1}`;
        params.push(routeId);
      }

      if (date) {
        query_text += ` AND b.departure_date = $${params.length + 1}`;
        params.push(date);
      }

      query_text += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(query_text, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM bookings b WHERE 1=1';
      if (status) countQuery += ` AND b.status = $1`;
      if (userId) countQuery += ` AND b.user_id = $${status ? 2 : 1}`;

      const countResult = await query(countQuery, params.slice(0, params.length - 2));

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  // Update booking status (admin only)
  async updateBookingStatus(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        throw errors.badRequest('Status is required');
      }

      const validStatuses = ['pending', 'confirmed', 'boarded', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw errors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const booking = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);

      if (booking.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const oldBooking = booking.rows[0];

      const updateResult = await query(
        `UPDATE bookings SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
        [status, notes || oldBooking.notes, bookingId]
      );

      await auditLog(req.user.userId, 'BOOKING_STATUS_UPDATED', 'booking', bookingId, oldBooking, updateResult.rows[0], 'success');

      res.json(apiResponse.success(updateResult.rows[0], `Booking status updated to ${status}`));
    } catch (error) {
      next(error);
    }
  }

  // Update booking payment status (admin only)
  async updatePaymentStatus(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { paymentStatus } = req.body;

      if (!paymentStatus) {
        throw errors.badRequest('Payment status is required');
      }

      const validPaymentStatuses = ['unpaid', 'pending', 'paid', 'refunded', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw errors.badRequest(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
      }

      const updateResult = await query(
        `UPDATE bookings SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [paymentStatus, bookingId]
      );

      if (updateResult.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      await auditLog(req.user.userId, 'BOOKING_PAYMENT_UPDATED', 'booking', bookingId, null, updateResult.rows[0], 'success');

      res.json(apiResponse.success(updateResult.rows[0], `Payment status updated to ${paymentStatus}`));
    } catch (error) {
      next(error);
    }
  }

  // Delete booking (admin only)
  async deleteBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      const booking = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);

      if (booking.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const bookingData = booking.rows[0];

      // Only allow deleting cancelled or pending bookings
      if (bookingData.status !== 'cancelled' && bookingData.status !== 'pending') {
        throw errors.badRequest(`Cannot delete booking with status: ${bookingData.status}`);
      }

      await query('DELETE FROM bookings WHERE id = $1', [bookingId]);

      await auditLog(req.user.userId, 'BOOKING_DELETED', 'booking', bookingId, bookingData, null, 'success');

      res.json(apiResponse.success({ bookingId }, 'Booking deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  // Edit booking details (admin only)
  async editBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { passengerNames, notes } = req.body;

      const updateResult = await query(
        `UPDATE bookings SET passenger_names = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
        [JSON.stringify(passengerNames), notes, bookingId]
      );

      if (updateResult.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      await auditLog(req.user.userId, 'BOOKING_EDITED', 'booking', bookingId, null, updateResult.rows[0], 'success');

      res.json(apiResponse.success(updateResult.rows[0], 'Booking updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default BookingController;
