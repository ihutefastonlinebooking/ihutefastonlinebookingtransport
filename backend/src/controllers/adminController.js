import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';

export class AdminController {
  // Company Management
  async getAllCompanies(req, res, next) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query_text = 'SELECT * FROM companies';
      let params = [];

      // Role-based filtering
      if (req.user.role === 'company_admin') {
        // Company admin can only see their own company
        const companyResult = await query('SELECT id FROM companies WHERE admin_user_id = $1', [req.user.userId]);
        if (companyResult.rows.length === 0) {
          return res.json(apiResponse.paginated([], page, limit, 0));
        }
        query_text += ` WHERE id = $${params.length + 1}`;
        params.push(companyResult.rows[0].id);
      }

      if (status) {
        query_text += params.length > 0 ? ` AND status = $${params.length + 1}` : ` WHERE status = $${params.length + 1}`;
        params.push(status);
      }

      query_text += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(query_text, params);
      const countResult = await query('SELECT COUNT(*) FROM companies' + (req.user.role === 'company_admin' ? ' WHERE admin_user_id = $1' : ''), req.user.role === 'company_admin' ? [req.user.userId] : []);

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  async approveCompany(req, res, next) {
    try {
      const { companyId } = req.params;

      const result = await query(
        `UPDATE companies SET status = $1, approved_at = CURRENT_TIMESTAMP, approved_by_user_id = $2
         WHERE id = $3 RETURNING *`,
        ['approved', req.user.userId, companyId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      await auditLog(req.user.userId, 'COMPANY_APPROVED', 'company', companyId, null, result.rows[0], 'success');

      res.json(apiResponse.success(result.rows[0], 'Company approved'));
    } catch (error) {
      next(error);
    }
  }

  async rejectCompany(req, res, next) {
    try {
      const { companyId } = req.params;
      const { reason } = req.body;

      const result = await query(
        `UPDATE companies SET status = $1, approved_by_user_id = $2 WHERE id = $3 RETURNING *`,
        ['rejected', req.user.userId, companyId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      await auditLog(req.user.userId, 'COMPANY_REJECTED', 'company', companyId, null, { reason }, 'success');

      res.json(apiResponse.success(result.rows[0], 'Company rejected'));
    } catch (error) {
      next(error);
    }
  }

  // Driver Management
  async getAllDrivers(req, res, next) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query_text = `SELECT d.*, u.email, u.phone, u.first_name, u.last_name, c.name as company_name
                       FROM drivers d
                       JOIN users u ON d.user_id = u.id
                       JOIN companies c ON d.company_id = c.id`;
      let params = [];

      // Role-based filtering
      if (req.user.role === 'company_admin') {
        // Company admin can only see drivers from their company
        const companyResult = await query('SELECT id FROM companies WHERE admin_user_id = $1', [req.user.userId]);
        if (companyResult.rows.length === 0) {
          return res.json(apiResponse.paginated([], page, limit, 0));
        }
        query_text += ` WHERE d.company_id = $${params.length + 1}`;
        params.push(companyResult.rows[0].id);
      }

      if (status) {
        query_text += params.length > 0 ? ` AND d.status = $${params.length + 1}` : ` WHERE d.status = $${params.length + 1}`;
        params.push(status);
      }

      query_text += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(query_text, params);
      const countQuery = 'SELECT COUNT(*) FROM drivers d' + (req.user.role === 'company_admin' ? ' JOIN companies c ON d.company_id = c.id WHERE c.admin_user_id = $1' : '');
      const countResult = await query(countQuery, req.user.role === 'company_admin' ? [req.user.userId] : []);

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  async approveDriver(req, res, next) {
    try {
      const { driverId } = req.params;

      const result = await query(
        `UPDATE drivers SET status = $1, approved_at = CURRENT_TIMESTAMP, approved_by_user_id = $2
         WHERE id = $3 RETURNING *`,
        ['approved', req.user.userId, driverId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Driver not found');
      }

      await auditLog(req.user.userId, 'DRIVER_APPROVED', 'driver', driverId, null, result.rows[0], 'success');

      res.json(apiResponse.success(result.rows[0], 'Driver approved'));
    } catch (error) {
      next(error);
    }
  }

  async suspendDriver(req, res, next) {
    try {
      const { driverId } = req.params;
      const { reason } = req.body;

      const result = await query(
        `UPDATE drivers SET status = $1 WHERE id = $2 RETURNING *`,
        ['suspended', driverId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Driver not found');
      }

      await auditLog(req.user.userId, 'DRIVER_SUSPENDED', 'driver', driverId, null, { reason }, 'success');

      res.json(apiResponse.success(result.rows[0], 'Driver suspended'));
    } catch (error) {
      next(error);
    }
  }

  // System Analytics
  async getAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Total bookings
      const bookingsCount = await query(
        `SELECT COUNT(*) as total FROM bookings WHERE DATE(created_at) BETWEEN $1 AND $2`,
        [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()]
      );

      // Revenue
      const revenue = await query(
        `SELECT SUM(total_price) as total FROM bookings WHERE status = 'completed' AND DATE(created_at) BETWEEN $1 AND $2`,
        [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()]
      );

      // Active drivers
      const drivers = await query(`SELECT COUNT(*) as total FROM drivers WHERE status = 'approved'`);

      // Active companies
      const companies = await query(`SELECT COUNT(*) as total FROM companies WHERE status = 'approved'`);

      res.json(apiResponse.success({
        totalBookings: bookingsCount.rows[0].total,
        revenue: revenue.rows[0].total || 0,
        activeDrivers: drivers.rows[0].total,
        activeCompanies: companies.rows[0].total,
      }, 'Analytics retrieved'));
    } catch (error) {
      next(error);
    }
  }

  // Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await query('SELECT COUNT(*) FROM audit_logs');

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  // System Settings
  async updateSystemSettings(req, res, next) {
    try {
      const { setting, value } = req.body;

      // In production, store this in a settings table
      await auditLog(req.user.userId, 'SYSTEM_SETTING_UPDATED', 'system', null, null, { setting, value }, 'success');

      res.json(apiResponse.success({ setting, value }, 'System setting updated'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
