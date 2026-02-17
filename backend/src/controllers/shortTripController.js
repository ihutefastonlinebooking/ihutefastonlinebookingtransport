import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, bookingValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import QRCodeService from '../services/QRCodeService.js';
import { generateQRSignature } from '../utils/crypto.js';

const qrService = new QRCodeService();

export class ShortTripController {
  // Search available short trip routes
  async searchShortTrips(req, res, next) {
    try {
      const { originCity, destinationCity, departureTime } = req.body;

      const result = await query(
        `SELECT r.*, c.name as company_name, v.seats_capacity, v.registration_number
         FROM routes r
         JOIN companies c ON r.company_id = c.id
         LEFT JOIN vehicles v ON r.company_id = v.company_id
         WHERE LOWER(r.origin_city) = LOWER($1)
         AND LOWER(r.destination_city) = LOWER($2)
         AND r.route_type = 'short_trip'
         AND r.status = 'active'
         ORDER BY r.price_per_seat ASC`,
        [originCity, destinationCity]
      );

      res.json(apiResponse.success(result.rows, 'Short trips found'));
    } catch (error) {
      next(error);
    }
  }

  // Book a short trip
  async bookShortTrip(req, res, next) {
    try {
      const { routeId, paymentMethod, ihuteCardId } = req.body;

      // Get route details
      const routeResult = await query(
        'SELECT * FROM routes WHERE id = $1 AND route_type = $2 AND status = $3',
        [routeId, 'short_trip', 'active']
      );

      if (routeResult.rows.length === 0) {
        throw errors.notFound('Short trip route not found');
      }

      const route = routeResult.rows[0];
      const bookingRef = `ST${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const bookingId = uuidv4();

      // Handle payment method
      if (paymentMethod === 'ihute_card') {
        if (!ihuteCardId) {
          throw errors.badRequest('iHute card ID required');
        }

        // Check card balance
        const cardResult = await query(
          'SELECT * FROM ihute_cards WHERE id = $1 AND user_id = $2 AND status = $3',
          [ihuteCardId, req.user.userId, 'active']
        );

        if (cardResult.rows.length === 0) {
          throw errors.notFound('iHute card not found');
        }

        const card = cardResult.rows[0];

        if (card.balance < route.price_per_seat) {
          throw errors.badRequest('Insufficient card balance');
        }

        // Deduct from card
        const newBalance = card.balance - route.price_per_seat;
        await query('UPDATE ihute_cards SET balance = $1 WHERE id = $2', [newBalance, ihuteCardId]);

        // Record transaction
        await query(
          `INSERT INTO card_transactions (card_id, user_id, transaction_type, amount, previous_balance, new_balance, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ihuteCardId, req.user.userId, 'debit', route.price_per_seat, card.balance, newBalance, `Short trip booking ${bookingRef}`]
        );
      }

      // Create booking
      const qrData = {
        type: 'short_trip',
        bookingId,
        bookingRef,
        userId: req.user.userId,
        routeId,
        price: route.price_per_seat,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const qrSignature = generateQRSignature(qrData);
      const qrCode = await qrService.generateQRCode(qrData, 'image');

      const bookingResult = await query(
        `INSERT INTO short_trip_bookings
         (id, route_id, user_id, booking_reference, status, payment_method, price, qr_code_data, qr_signature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          bookingId,
          routeId,
          req.user.userId,
          bookingRef,
          'unused',
          paymentMethod,
          route.price_per_seat,
          JSON.stringify(qrData),
          qrSignature,
        ]
      );

      await auditLog(req.user.userId, 'SHORT_TRIP_BOOKED', 'short_trip_booking', bookingId, null, bookingResult.rows[0], 'success');

      res.status(201).json(apiResponse.success(
        {
          bookingId,
          bookingReference: bookingRef,
          price: route.price_per_seat,
          qrCode,
          status: 'unused',
          route: {
            origin: route.origin_city,
            destination: route.destination_city,
          },
        },
        'Short trip booked successfully',
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get user's short trip bookings
  async getUserShortTrips(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query_text = `SELECT stb.*, r.origin_city, r.destination_city, r.price_per_seat
                        FROM short_trip_bookings stb
                        JOIN routes r ON stb.route_id = r.id
                        WHERE stb.user_id = $1`;
      let params = [req.user.userId];

      if (status) {
        query_text += ` AND stb.status = $${params.length + 1}`;
        params.push(status);
      }

      query_text += ` ORDER BY stb.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(query_text, params);
      const countResult = await query(
        'SELECT COUNT(*) FROM short_trip_bookings WHERE user_id = $1',
        [req.user.userId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  // Get specific short trip booking
  async getShortTripBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      const result = await query(
        `SELECT stb.*, r.origin_city, r.destination_city
         FROM short_trip_bookings stb
         JOIN routes r ON stb.route_id = r.id
         WHERE stb.id = $1`,
        [bookingId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = result.rows[0];

      // Authorization check
      if (booking.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('Unauthorized access to booking');
      }

      res.json(apiResponse.success(booking, 'Booking retrieved'));
    } catch (error) {
      next(error);
    }
  }

  // Cancel short trip booking
  async cancelShortTrip(req, res, next) {
    try {
      const { bookingId } = req.params;

      const result = await query(
        'SELECT * FROM short_trip_bookings WHERE id = $1',
        [bookingId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = result.rows[0];

      if (booking.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('Unauthorized cancellation');
      }

      if (booking.status !== 'unused') {
        throw errors.badRequest('Cannot cancel used or expired ticket');
      }

      // Refund if paid via card or MoMo
      if (booking.payment_method === 'momo') {
        // Process MoMo refund
        await query(
          'UPDATE short_trip_bookings SET status = $1 WHERE id = $2',
          ['cancelled', bookingId]
        );
      } else {
        await query(
          'UPDATE short_trip_bookings SET status = $1 WHERE id = $2',
          ['cancelled', bookingId]
        );
      }

      await auditLog(req.user.userId, 'SHORT_TRIP_CANCELLED', 'short_trip_booking', bookingId, null, null, 'success');

      res.json(apiResponse.success(
        { status: 'cancelled', refund: booking.price },
        'Short trip booking cancelled'
      ));
    } catch (error) {
      next(error);
    }
  }
}

export default ShortTripController;
