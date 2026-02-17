import { query } from '../db/connection.js';
import { apiResponse, errors } from '../utils/response.js';

/**
 * Check if user is Super Admin
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      throw errors.forbidden('Super admin access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is Company Admin
 */
export const requireCompanyAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'company_admin') {
      throw errors.forbidden('Company admin access required');
    }

    // Verify user has a company
    const result = await query(
      'SELECT id FROM companies WHERE admin_user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      throw errors.forbidden('You are not associated with any company');
    }

    req.company = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is Driver
 */
export const requireDriver = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'driver') {
      throw errors.forbidden('Driver access required');
    }

    // Verify user is an approved driver
    const result = await query(
      'SELECT * FROM drivers WHERE user_id = $1 AND status = $2',
      [req.user.userId, 'approved']
    );

    if (result.rows.length === 0) {
      throw errors.forbidden('You are not an approved driver');
    }

    req.driver = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is Client
 */
export const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json(apiResponse.error('Client access required', 403));
  }
  next();
};

/**
 * Generic role checker
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        apiResponse.error(`Access required. Allowed roles: ${allowedRoles.join(', ')}`, 403)
      );
    }
    next();
  };
};

export default {
  requireSuperAdmin,
  requireCompanyAdmin,
  requireDriver,
  requireClient,
  requireRole,
};
