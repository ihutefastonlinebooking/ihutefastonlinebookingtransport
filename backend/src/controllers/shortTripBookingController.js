import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import { generateQRCode } from '../utils/crypto.js';
import SMSService from '../services/SMSService.js';
import EmailService from '../services/EmailService.js';

// Lazy initialization of SMS service
let smsService = null;
const getSmsService = () => {
  if (!smsService) {
    smsService = new SMSService();
  }
  return smsService;
};
const emailService = new EmailService();

export class ShortTripBookingController {
  /**
   * Get available short trip routes
   */
  async getAvailableRoutes(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT sr.* FROM short_trip_routes sr
         WHERE sr.status = 'active'
         ORDER BY sr.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await query('SELECT COUNT(*) FROM short_trip_routes WHERE status = $1', ['active']);

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get short trip route details
   */
  async getRouteDetails(req, res, next) {
    try {
      const { routeId } = req.params;

      const result = await query('SELECT * FROM short_trip_routes WHERE id = $1', [routeId]);

      if (result.rows.length === 0) {
        throw errors.notFound('Route not found');
      }

      res.json(apiResponse.success(result.rows[0], 'Route retrieved'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create short trip booking
   */
  async createBooking(req, res, next) {
    try {
      const { routeId, numberOfSeats, paymentMethod, phone, email } = req.body;

      // Validate input
      if (!routeId || !numberOfSeats || numberOfSeats < 1 || !paymentMethod) {
        throw errors.badRequest('Missing required fields: routeId, numberOfSeats, paymentMethod');
      }

      // Get route details
      const routeResult = await query('SELECT * FROM short_trip_routes WHERE id = $1 AND status = $1', [
        routeId,
        'active',
      ]);

      if (routeResult.rows.length === 0) {
        throw errors.notFound('Route not available');
      }

      const route = routeResult.rows[0];

      // Check availability
      if (route.available_seats < numberOfSeats) {
        throw errors.badRequest(`Only ${route.available_seats} seats available`);
      }

      // Create booking
      const bookingId = uuidv4();
      const bookingReference = `STB-${Date.now()}`;

      const totalPrice = route.price_per_seat * numberOfSeats;

      const bookingResult = await query(
        `INSERT INTO short_trip_bookings 
         (id, route_id, user_id, booking_reference, number_of_seats, total_price, payment_method, phone, email, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [bookingId, routeId, req.user.userId, bookingReference, numberOfSeats, totalPrice, paymentMethod, phone, email, 'pending']
      );

      const booking = bookingResult.rows[0];

      // Generate ticket with QR code
      const ticketId = uuidv4();
      const qrCode = await generateQRCode(JSON.stringify({ ticketId, bookingReference }));

      await query(
        `INSERT INTO tickets (id, booking_id, booking_type, user_id, qr_code, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ticketId, bookingId, 'short_trip', req.user.userId, qrCode, 'valid']
      );

      await auditLog(req.user.userId, 'SHORT_TRIP_BOOKING_CREATED', 'short_trip_booking', bookingId, null, booking, 'success');

      // Send confirmation SMS
      if (phone) {
        await getSmsService().sendConfirmation(phone, `Your booking ${bookingReference} is confirmed. Price: ${totalPrice}`);
      }

      // Send confirmation email
      if (email) {
        await emailService.sendBookingConfirmation(email, {
          bookingReference,
          departureTime: route.departure_time,
          numberOfSeats,
          totalPrice,
        });
      }

      res.status(201).json(apiResponse.success(booking, 'Short trip booking created'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's short trip bookings
   */
  async getUserBookings(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'stb.user_id = $1';
      let params = [req.user.userId];

      if (status) {
        whereClause += ` AND stb.status = $${params.length + 1}`;
        params.push(status);
      }

      const result = await query(
        `SELECT stb.*, str.origin_location, str.destination_location, str.departure_time, str.price_per_seat
         FROM short_trip_bookings stb
         JOIN short_trip_routes str ON stb.route_id = str.id
         WHERE ${whereClause}
         ORDER BY stb.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const countResult = await query(`SELECT COUNT(*) FROM short_trip_bookings WHERE ${whereClause}`, params);

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel short trip booking
   */
  async cancelBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      // Get booking
      const bookingResult = await query('SELECT * FROM short_trip_bookings WHERE id = $1', [bookingId]);

      if (bookingResult.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = bookingResult.rows[0];

      // Check authorization
      if (booking.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('You cannot cancel this booking');
      }

      // Check if can be cancelled (must be pending or confirmed)
      if (!['pending', 'confirmed'].includes(booking.status)) {
        throw errors.badRequest('This booking cannot be cancelled');
      }

      // Update booking status
      const updateResult = await query(
        'UPDATE short_trip_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['cancelled', bookingId]
      );

      const updatedBooking = updateResult.rows[0];

      await auditLog(req.user.userId, 'SHORT_TRIP_BOOKING_CANCELLED', 'short_trip_booking', bookingId, booking, updatedBooking, 'success');

      res.json(apiResponse.success(updatedBooking, 'Booking cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all short trip bookings (Admin)
   */
  async getAllBookings(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      let params = [];

      if (status) {
        whereClause += ` AND stb.status = $${params.length + 1}`;
        params.push(status);
      }

      const result = await query(
        `SELECT stb.*, str.origin_location, str.destination_location, u.first_name, u.last_name, u.email, u.phone
         FROM short_trip_bookings stb
         JOIN short_trip_routes str ON stb.route_id = str.id
         JOIN users u ON stb.user_id = u.id
         WHERE ${whereClause}
         ORDER BY stb.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) FROM short_trip_bookings WHERE ${whereClause}`,
        params
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }
}

export default ShortTripBookingController;
