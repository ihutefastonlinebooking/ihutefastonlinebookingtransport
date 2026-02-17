import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, companyValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';

export class CompanyController {
  async registerCompany(req, res, next) {
    try {
      const validatedData = validate(companyValidationSchemas.register, req.body);

      // Check if company already exists
      const existingCompany = await query(
        'SELECT id FROM companies WHERE registration_number = $1',
        [validatedData.registrationNumber]
      );

      if (existingCompany.rows.length > 0) {
        throw errors.conflict('Company already registered', { registrationNumber: 'This registration number is already in use' });
      }

      // Create company
      const companyId = uuidv4();
      const result = await query(
        `INSERT INTO companies (id, admin_user_id, name, description, registration_number, tax_id, phone, email, address, city, country, website, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          companyId,
          req.user.userId,
          validatedData.name,
          validatedData.description || null,
          validatedData.registrationNumber,
          validatedData.taxId || null,
          validatedData.phone,
          validatedData.email,
          validatedData.address,
          validatedData.city,
          validatedData.country,
          validatedData.website || null,
          'pending',
        ]
      );

      const company = result.rows[0];

      await auditLog(req.user.userId, 'COMPANY_REGISTERED', 'company', company.id, null, company, 'success');

      res.status(201).json(apiResponse.success(
        {
          companyId: company.id,
          status: company.status,
          message: 'Company registration submitted. Awaiting approval.',
        },
        'Company registration successful',
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  async getCompanyProfile(req, res, next) {
    try {
      const result = await query(
        'SELECT * FROM companies WHERE admin_user_id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      const company = result.rows[0];
      res.json(apiResponse.success(company, 'Company profile retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyProfile(req, res, next) {
    try {
      const validatedData = validate(companyValidationSchemas.update, req.body);

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (validatedData.name) {
        updates.push(`name = $${paramCount++}`);
        values.push(validatedData.name);
      }
      if (validatedData.phone) {
        updates.push(`phone = $${paramCount++}`);
        values.push(validatedData.phone);
      }
      if (validatedData.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(validatedData.email);
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
      if (validatedData.website) {
        updates.push(`website = $${paramCount++}`);
        values.push(validatedData.website);
      }

      if (updates.length === 0) {
        throw errors.badRequest('No fields to update');
      }

      values.push(req.user.userId);

      const result = await query(
        `UPDATE companies SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE admin_user_id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      const company = result.rows[0];

      await auditLog(req.user.userId, 'COMPANY_UPDATED', 'company', company.id, null, company, 'success');

      res.json(apiResponse.success(company, 'Company profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getCompanyVehicles(req, res, next) {
    try {
      // Get company first
      const companyResult = await query(
        'SELECT id FROM companies WHERE admin_user_id = $1',
        [req.user.userId]
      );

      if (companyResult.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      const companyId = companyResult.rows[0].id;

      const result = await query(
        'SELECT * FROM vehicles WHERE company_id = $1 ORDER BY created_at DESC',
        [companyId]
      );

      res.json(apiResponse.success(result.rows, 'Company vehicles retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async getCompanyRoutes(req, res, next) {
    try {
      // Get company first
      const companyResult = await query(
        'SELECT id FROM companies WHERE admin_user_id = $1',
        [req.user.userId]
      );

      if (companyResult.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      const companyId = companyResult.rows[0].id;

      const result = await query(
        'SELECT * FROM routes WHERE company_id = $1 ORDER BY created_at DESC',
        [companyId]
      );

      res.json(apiResponse.success(result.rows, 'Company routes retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async getCompanyBookings(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      // Get company first
      const companyResult = await query(
        'SELECT id FROM companies WHERE admin_user_id = $1',
        [req.user.userId]
      );

      if (companyResult.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      const companyId = companyResult.rows[0].id;

      let query_text = `
        SELECT b.* FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN companies c ON r.company_id = c.id
        WHERE c.id = $1`;
      let params = [companyId];

      if (status) {
        query_text += ` AND b.status = $${params.length + 1}`;
        params.push(status);
      }

      query_text += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(query_text, params);

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM bookings b
         JOIN routes r ON b.route_id = r.id
         WHERE r.company_id = $1`,
        [companyId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  async getCompanyDrivers(req, res, next) {
    try {
      // Get company first
      const companyResult = await query(
        'SELECT id FROM companies WHERE admin_user_id = $1',
        [req.user.userId]
      );

      if (companyResult.rows.length === 0) {
        throw errors.notFound('Company not found');
      }

      const companyId = companyResult.rows[0].id;

      const result = await query(
        `SELECT d.*, u.email, u.phone, u.first_name, u.last_name
         FROM drivers d
         JOIN users u ON d.user_id = u.id
         WHERE d.company_id = $1
         ORDER BY d.created_at DESC`,
        [companyId]
      );

      res.json(apiResponse.success(result.rows, 'Company drivers retrieved'));
    } catch (error) {
      next(error);
    }
  }
}

export default CompanyController;
