import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, driverValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';

export class DriverController {
  async registerDriver(req, res, next) {
    try {
      const validatedData = validate(driverValidationSchemas.register, req.body);

      // Check if already a driver
      const existingDriver = await query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [req.user.userId]
      );

      if (existingDriver.rows.length > 0) {
        throw errors.conflict('User is already registered as a driver');
      }

      // Get user company info or require company_id
      const { companyId } = req.body;
      if (!companyId) {
        throw errors.badRequest('Company ID is required');
      }

      // Verify company exists
      const companyResult = await query(
        'SELECT id FROM companies WHERE id = $1 AND status = $2',
        [companyId, 'approved']
      );

      if (companyResult.rows.length === 0) {
        throw errors.badRequest('Invalid or unapproved company');
      }

      // Create driver record
      const driverId = uuidv4();
      const result = await query(
        `INSERT INTO drivers (id, user_id, company_id, license_number, license_expiry_date, vehicle_registration_number, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          driverId,
          req.user.userId,
          companyId,
          validatedData.licenseNumber,
          validatedData.licenseExpiryDate,
          validatedData.vehicleRegistrationNumber,
          'pending',
        ]
      );

      const driver = result.rows[0];

      await auditLog(req.user.userId, 'DRIVER_REGISTERED', 'driver', driver.id, null, driver, 'success');

      res.status(201).json(apiResponse.success(
        {
          driverId: driver.id,
          status: driver.status,
          message: 'Driver registration submitted. Awaiting approval.',
        },
        'Driver registration successful',
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  async getDriverProfile(req, res, next) {
    try {
      const result = await query(
        `SELECT d.*, u.email, u.phone, u.first_name, u.last_name, c.name as company_name
         FROM drivers d
         JOIN users u ON d.user_id = u.id
         JOIN companies c ON d.company_id = c.id
         WHERE d.user_id = $1`,
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Driver profile not found');
      }

      const driver = result.rows[0];

      res.json(apiResponse.success(driver, 'Driver profile retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async updateDriverStatus(req, res, next) {
    try {
      const { online_status } = req.body;

      if (!['online', 'offline', 'on_trip'].includes(online_status)) {
        throw errors.badRequest('Invalid online status');
      }

      const result = await query(
        'UPDATE drivers SET online_status = $1 WHERE user_id = $2 RETURNING *',
        [online_status, req.user.userId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Driver not found');
      }

      res.json(apiResponse.success(result.rows[0], 'Driver status updated'));
    } catch (error) {
      next(error);
    }
  }

  async getTodayTrips(req, res, next) {
    try {
      const driverResult = await query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [req.user.userId]
      );

      if (driverResult.rows.length === 0) {
        throw errors.notFound('Driver not found');
      }

      const driverId = driverResult.rows[0].id;

      const result = await query(
        `SELECT b.*, r.origin_city, r.destination_city, r.price_per_seat
         FROM bookings b
         JOIN routes r ON b.route_id = r.id
         WHERE b.vehicle_id IN (SELECT id FROM vehicles WHERE driver_id = $1)
         AND DATE(b.departure_date) = CURRENT_DATE
         AND b.status = 'confirmed'
         ORDER BY b.departure_date ASC`,
        [driverId]
      );

      res.json(apiResponse.success(result.rows, 'Today trips retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async getDriverStats(req, res, next) {
    try {
      const driverResult = await query(
        'SELECT rating, total_trips FROM drivers WHERE user_id = $1',
        [req.user.userId]
      );

      if (driverResult.rows.length === 0) {
        throw errors.notFound('Driver profile not found');
      }

      const driver = driverResult.rows[0];

      // Get reviews
      const reviewsResult = await query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
         FROM ratings WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = $1)`,
        [req.user.userId]
      );

      // Get earnings (mock)
      const earningsResult = await query(
        `SELECT SUM(b.total_price) as total_earnings
         FROM bookings b
         WHERE b.vehicle_id IN (SELECT id FROM vehicles WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = $1))
         AND b.status = 'completed'`,
        [req.user.userId]
      );

      res.json(apiResponse.success(
        {
          rating: driver.rating,
          totalTrips: driver.total_trips,
          reviews: reviewsResult.rows[0],
          earnings: earningsResult.rows[0],
        },
        'Driver statistics retrieved'
      ));
    } catch (error) {
      next(error);
    }
  }

  async shareLocation(req, res, next) {
    try {
      const { latitude, longitude, accuracy, speed, heading, bookingId } = req.body;

      const driverResult = await query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [req.user.userId]
      );

      if (driverResult.rows.length === 0) {
        throw errors.notFound('Driver profile not found');
      }

      const driverId = driverResult.rows[0].id;

      const result = await query(
        `INSERT INTO driver_locations (driver_id, booking_id, latitude, longitude, accuracy, speed, heading)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [driverId, bookingId, latitude, longitude, accuracy, speed, heading]
      );

      // Notify client via WebSocket (handled in WebSocket handler)
      res.json(apiResponse.success(result.rows[0], 'Location shared'));
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT r.*, u.first_name, u.last_name
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         WHERE r.driver_id IN (SELECT id FROM drivers WHERE user_id = $1)
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) FROM ratings WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = $1)`,
        [req.user.userId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }
}

export default DriverController;
