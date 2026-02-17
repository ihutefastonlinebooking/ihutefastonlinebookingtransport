import { query } from '../db/connection.js';
import { validate, userValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';

export class UserController {
  async updateProfile(req, res, next) {
    try {
      const validatedData = validate(userValidationSchemas.updateProfile, req.body);
      
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (validatedData.firstName) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(validatedData.firstName);
      }
      if (validatedData.lastName) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(validatedData.lastName);
      }
      if (validatedData.phone) {
        updates.push(`phone = $${paramCount++}`);
        values.push(validatedData.phone);
      }
      if (validatedData.dateOfBirth) {
        updates.push(`date_of_birth = $${paramCount++}`);
        values.push(validatedData.dateOfBirth);
      }
      if (validatedData.address) {
        updates.push(`address = $${paramCount++}`);
        values.push(validatedData.address);
      }
      if (validatedData.city) {
        updates.push(`city = $${paramCount++}`);
        values.push(validatedData.city);
      }
      if (validatedData.country) {
        updates.push(`country = $${paramCount++}`);
        values.push(validatedData.country);
      }

      if (updates.length === 0) {
        throw errors.badRequest('No fields to update');
      }

      values.push(req.user.userId);

      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
         RETURNING id, email, first_name, last_name, phone, city, country, address`,
        values
      );

      if (result.rows.length === 0) {
        throw errors.notFound('User not found');
      }

      const user = result.rows[0];

      await auditLog(req.user.userId, 'PROFILE_UPDATED', 'user', user.id, null, user, 'success');

      res.json(apiResponse.success(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await query(
        'SELECT id, email, first_name, last_name, phone, role, status, city, country, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('User not found');
      }

      res.json(apiResponse.success(result.rows[0], 'User retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw errors.badRequest('Current password and new password are required');
      }

      // Get current user
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
      if (result.rows.length === 0) {
        throw errors.notFound('User not found');
      }

      // Verify current password
      const { comparePassword } = await import('../utils/crypto.js');
      const passwordValid = await comparePassword(currentPassword, result.rows[0].password_hash);
      if (!passwordValid) {
        throw errors.unauthorized('Current password is incorrect');
      }

      // Hash and update new password
      const { hashPassword } = await import('../utils/crypto.js');
      const hashedPassword = await hashPassword(newPassword);
      
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.userId]);

      await auditLog(req.user.userId, 'PASSWORD_CHANGED', 'user', req.user.userId, null, null, 'success');

      res.json(apiResponse.success(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get booking stats
      const bookingStats = await query(
        'SELECT COUNT(*) as total, status FROM bookings WHERE user_id = $1 GROUP BY status',
        [userId]
      );

      // Get spending
      const spending = await query(
        'SELECT SUM(total_price) as total_spent FROM bookings WHERE user_id = $1 AND status = $2',
        [userId, 'completed']
      );

      // Get rating as driver (if driver)
      const driverInfo = await query(
        'SELECT rating, total_trips FROM drivers WHERE user_id = $1',
        [userId]
      );

      res.json(apiResponse.success({
        bookings: bookingStats.rows,
        totalSpent: spending.rows[0]?.total_spent || 0,
        driverInfo: driverInfo.rows[0] || null,
      }, 'User statistics retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const { password } = req.body;

      if (!password) {
        throw errors.badRequest('Password is required to delete account');
      }

      // Verify password
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
      if (result.rows.length === 0) {
        throw errors.notFound('User not found');
      }

      const { comparePassword } = await import('../utils/crypto.js');
      const passwordValid = await comparePassword(password, result.rows[0].password_hash);
      if (!passwordValid) {
        throw errors.unauthorized('Password is incorrect');
      }

      // Soft delete - mark as inactive
      await query('UPDATE users SET status = $1 WHERE id = $2', ['inactive', req.user.userId]);

      await auditLog(req.user.userId, 'ACCOUNT_DELETED', 'user', req.user.userId, null, null, 'success');

      res.json(apiResponse.success(null, 'Account deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
