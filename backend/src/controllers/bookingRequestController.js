import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, bookingRequestValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';

export class BookingRequestController {
  async createBookingRequest(req, res, next) {
    try {
      const validatedData = validate(bookingRequestValidationSchemas.create, req.body);

      // Create booking request
      const requestId = uuidv4();
      const result = await query(
        `INSERT INTO booking_requests
         (id, full_name, email, phone, origin_city, destination_city, departure_date, return_date, number_of_passengers, vehicle_type, special_requirements, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          requestId,
          validatedData.fullName,
          validatedData.email,
          validatedData.phone,
          validatedData.originCity,
          validatedData.destinationCity,
          validatedData.departureDate,
          validatedData.returnDate || null,
          validatedData.numberOfPassengers,
          validatedData.vehicleType,
          validatedData.specialRequirements || null,
          'pending'
        ]
      );

      // Log the action
      await auditLog({
        userId: null, // No authenticated user for booking requests
        action: 'CREATE_BOOKING_REQUEST',
        tableName: 'booking_requests',
        recordId: requestId,
        newValues: validatedData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(apiResponse.success(result.rows[0], 'Booking request submitted successfully. Our team will contact you soon.'));
    } catch (error) {
      next(error);
    }
  }

  async getBookingRequests(req, res, next) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '';
      let params = [limit, offset];
      let paramIndex = 3;

      if (status) {
        whereClause = 'WHERE status = $3';
        params = [limit, offset, status];
        paramIndex = 4;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM booking_requests ${whereClause.replace('$3', '$1').replace('$4', '$2')}`,
        status ? [status] : []
      );

      // Get booking requests
      const result = await query(
        `SELECT * FROM booking_requests
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json(apiResponse.success({
        requests: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }, 'Booking requests retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getBookingRequestById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await query(
        'SELECT * FROM booking_requests WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Booking request not found');
      }

      res.json(apiResponse.success(result.rows[0], 'Booking request retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateBookingRequestStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const validStatuses = ['pending', 'reviewed', 'contacted', 'confirmed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw errors.badRequest('Invalid status');
      }

      // Get current request
      const currentResult = await query(
        'SELECT * FROM booking_requests WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        throw errors.notFound('Booking request not found');
      }

      const currentRequest = currentResult.rows[0];

      // Update request
      const result = await query(
        `UPDATE booking_requests
         SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, adminNotes || null, id]
      );

      // Log the action
      await auditLog({
        userId: req.user?.userId,
        action: 'UPDATE_BOOKING_REQUEST_STATUS',
        tableName: 'booking_requests',
        recordId: id,
        oldValues: { status: currentRequest.status, admin_notes: currentRequest.admin_notes },
        newValues: { status, admin_notes: adminNotes },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(apiResponse.success(result.rows[0], 'Booking request status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteBookingRequest(req, res, next) {
    try {
      const { id } = req.params;

      // Get current request for logging
      const currentResult = await query(
        'SELECT * FROM booking_requests WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        throw errors.notFound('Booking request not found');
      }

      // Delete request
      await query('DELETE FROM booking_requests WHERE id = $1', [id]);

      // Log the action
      await auditLog({
        userId: req.user?.userId,
        action: 'DELETE_BOOKING_REQUEST',
        tableName: 'booking_requests',
        recordId: id,
        oldValues: currentResult.rows[0],
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(apiResponse.success(null, 'Booking request deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}