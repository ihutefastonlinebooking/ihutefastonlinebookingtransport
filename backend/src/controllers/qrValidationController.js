import { query } from '../db/connection.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import { verifyQRSignature } from '../utils/crypto.js';

export class QRValidationController {
  // Scan QR ticket (for drivers)
  async scanTicket(req, res, next) {
    try {
      const { qrData, vehicleId } = req.body;

      // Verify driver
      const driverResult = await query(
        'SELECT id FROM drivers WHERE user_id = $1 AND status = $2',
        [req.user.userId, 'approved']
      );

      if (driverResult.rows.length === 0) {
        throw errors.forbidden('Only approved drivers can scan tickets');
      }

      const driverId = driverResult.rows[0].id;

      try {
        const qrContent = JSON.parse(qrData);

        // Validate QR type
        if (!['short_trip', 'booking'].includes(qrContent.type)) {
          throw errors.badRequest('Invalid QR code type');
        }

        // Check expiration
        if (new Date() > new Date(qrContent.expiresAt)) {
          throw errors.badRequest('QR code expired');
        }

        if (qrContent.type === 'short_trip') {
          return await this.validateShortTripTicket(qrContent, driverId, vehicleId, req.user.userId, res, next);
        } else if (qrContent.type === 'booking') {
          return await this.validateLongTripTicket(qrContent, driverId, vehicleId, req.user.userId, res, next);
        }
      } catch (error) {
        throw errors.badRequest('Invalid QR code format');
      }
    } catch (error) {
      next(error);
    }
  }

  // Validate short trip ticket
  async validateShortTripTicket(qrContent, driverId, vehicleId, userId, res, next) {
    try {
      const { bookingId, bookingRef } = qrContent;

      // Get booking
      const bookingResult = await query(
        'SELECT * FROM short_trip_bookings WHERE id = $1',
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        throw errors.notFound('Ticket not found');
      }

      const booking = bookingResult.rows[0];

      // Check if already used
      if (booking.status === 'used') {
        throw errors.badRequest('Ticket already used');
      }

      if (booking.status === 'cancelled') {
        throw errors.badRequest('Ticket has been cancelled');
      }

      // Mark as used
      const updateResult = await query(
        `UPDATE short_trip_bookings
         SET status = $1, used_at = CURRENT_TIMESTAMP, used_by_driver_id = $2
         WHERE id = $3
         RETURNING *`,
        ['used', driverId, bookingId]
      );

      // Record scan
      await query(
        `INSERT INTO ticket_scans (booking_id, driver_id, vehicle_id, scan_type, status, scanned_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [bookingId, driverId, vehicleId, 'short_trip', 'success']
      );

      await auditLog(userId, 'TICKET_SCANNED', 'short_trip_booking', bookingId, null, {
        scannedAt: new Date(),
        driverId,
      }, 'success');

      res.json(apiResponse.success(
        {
          ticketType: 'short_trip',
          bookingReference: bookingRef,
          status: 'valid',
          passenger: booking.user_id,
          markedUsedAt: new Date(),
        },
        'Ticket validated successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  // Validate long distance trip ticket
  async validateLongTripTicket(qrContent, driverId, vehicleId, userId, res, next) {
    try {
      const { bookingId, bookingRef } = qrContent;

      // Get booking
      const bookingResult = await query(
        'SELECT * FROM bookings WHERE id = $1',
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = bookingResult.rows[0];

      // Check booking status
      if (booking.status !== 'confirmed') {
        throw errors.badRequest('Booking not confirmed');
      }

      if (booking.payment_status !== 'paid') {
        throw errors.badRequest('Payment not received');
      }

      // Record scan
      const scanResult = await query(
        `INSERT INTO ticket_scans (booking_id, driver_id, vehicle_id, scan_type, status, scanned_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [bookingId, driverId, vehicleId, 'boarding', 'success']
      );

      await auditLog(userId, 'LONG_TRIP_TICKET_SCANNED', 'booking', bookingId, null, {
        scannedAt: new Date(),
        driverId,
        scanId: scanResult.rows[0].id,
      }, 'success');

      res.json(apiResponse.success(
        {
          ticketType: 'long_trip',
          bookingReference: bookingRef,
          status: 'valid',
          seats: booking.number_of_seats,
          passenger: booking.user_id,
          markedUsedAt: new Date(),
        },
        'Long trip ticket validated'
      ));
    } catch (error) {
      next(error);
    }
  }

  // Scan iHute card
  async scanIhuteCard(req, res, next) {
    try {
      const { qrData, routeId, vehicleId } = req.body;

      // Verify driver
      const driverResult = await query(
        'SELECT id FROM drivers WHERE user_id = $1 AND status = $2',
        [req.user.userId, 'approved']
      );

      if (driverResult.rows.length === 0) {
        throw errors.forbidden('Only approved drivers can scan cards');
      }

      const driverId = driverResult.rows[0].id;

      try {
        const cardContent = JSON.parse(qrData);

        if (cardContent.type !== 'ihute_card') {
          throw errors.badRequest('Invalid card QR code');
        }

        const { cardId } = cardContent;

        // Get card
        const cardResult = await query(
          'SELECT * FROM ihute_cards WHERE id = $1 AND status = $2',
          [cardId, 'active']
        );

        if (cardResult.rows.length === 0) {
          throw errors.notFound('Card not found or inactive');
        }

        const card = cardResult.rows[0];

        // Get route price
        const routeResult = await query(
          'SELECT price_per_seat FROM routes WHERE id = $1',
          [routeId]
        );

        if (routeResult.rows.length === 0) {
          throw errors.notFound('Route not found');
        }

        const route = routeResult.rows[0];

        // Check balance
        if (card.balance < route.price_per_seat) {
          throw errors.badRequest('Insufficient card balance');
        }

        // Deduct fare
        const newBalance = card.balance - route.price_per_seat;
        await query(
          'UPDATE ihute_cards SET balance = $1, last_used_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newBalance, cardId]
        );

        // Record transaction
        await query(
          `INSERT INTO card_transactions (card_id, user_id, transaction_type, amount, previous_balance, new_balance, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cardId, card.user_id, 'debit', route.price_per_seat, card.balance, newBalance, routeId]
        );

        // Record scan
        await query(
          `INSERT INTO ticket_scans (driver_id, vehicle_id, scan_type, status, scanned_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [driverId, vehicleId, 'ihute_card', 'success']
        );

        await auditLog(req.user.userId, 'IHUTE_CARD_SCANNED', 'ihute_card', cardId, null, {
          faireDeducted: route.price_per_seat,
          newBalance,
        }, 'success');

        res.json(apiResponse.success(
          {
            cardType: 'ihute_card',
            previousBalance: card.balance,
            newBalance,
            faireDeducted: route.price_per_seat,
            transactionId: `${Date.now()}`,
            status: 'success',
          },
          'Card scanned and balance deducted'
        ));
      } catch (error) {
        throw errors.badRequest('Invalid QR code format');
      }
    } catch (error) {
      next(error);
    }
  }

  // Get ticket scan history
  async getTicketScanHistory(req, res, next) {
    try {
      const { vehicleId, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query_text = `SELECT ts.*, b.booking_reference, stb.booking_reference as short_trip_ref
                       FROM ticket_scans ts
                       LEFT JOIN bookings b ON ts.booking_id = b.id
                       LEFT JOIN short_trip_bookings stb ON ts.booking_id = stb.id`;
      let params = [];

      if (vehicleId) {
        query_text += ` WHERE ts.vehicle_id = $${params.length + 1}`;
        params.push(vehicleId);
      }

      query_text += ` ORDER BY ts.scanned_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(query_text, params);
      const countResult = await query('SELECT COUNT(*) FROM ticket_scans');

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }
}

export default QRValidationController;
