import { verifyAccessToken } from '../utils/jwt.js';
import { query } from '../db/connection.js';
import { apiResponse, errors } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(apiResponse.error('Missing or invalid token', 401));
    }

    const token = authHeader.slice(7);
    
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      
      // Fetch user details
      const result = await query('SELECT id, email, role, status FROM users WHERE id = $1', [decoded.userId]);
      
      if (result.rows.length === 0) {
        return res.status(401).json(apiResponse.error('User not found', 401));
      }

      const user = result.rows[0];
      
      if (user.status === 'blocked' || user.status === 'inactive') {
        return res.status(403).json(apiResponse.error('User account is inactive', 403));
      }

      req.user = { ...decoded, ...user };
      next();
    } catch (err) {
      return res.status(401).json(apiResponse.error(err.message, 401));
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json(apiResponse.error('Authentication failed', 500));
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(apiResponse.error('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(apiResponse.error(
        `Only ${allowedRoles.join(', ')} can access this resource`,
        403
      ));
    }

    next();
  };
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json(apiResponse.error(
        `This action requires ${role} role`,
        403
      ));
    }
    next();
  };
};

export const requireOneOfRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(apiResponse.error(
        `Insufficient permissions`,
        403
      ));
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        
        // Fetch user details
        const result = await query('SELECT id, email, role, status FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          if (user.status !== 'blocked' && user.status !== 'inactive') {
            req.user = { ...decoded, ...user };
          }
        }
      } catch (err) {
        // Continue without authentication
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const isDriver = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'driver') {
      return res.status(403).json(apiResponse.error('Driver access required', 403));
    }

    // Check if user is an approved driver
    const result = await query(
      'SELECT * FROM drivers WHERE user_id = $1 AND status = $2',
      [req.user.userId, 'approved']
    );

    if (result.rows.length === 0) {
      return res.status(403).json(apiResponse.error('You are not an approved driver', 403));
    }

    req.driver = result.rows[0];
    next();
  } catch (error) {
    console.error('Driver check error:', error);
    res.status(500).json(apiResponse.error('Driver verification failed', 500));
  }
};

export const isCompanyAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'company_admin') {
      return res.status(403).json(apiResponse.error('Company admin access required', 403));
    }

    // Check if user is an admin for a company
    const result = await query(
      'SELECT * FROM companies WHERE admin_user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json(apiResponse.error('Company not found', 403));
    }

    req.company = result.rows[0];
    next();
  } catch (error) {
    console.error('Company admin check error:', error);
    res.status(500).json(apiResponse.error('Company admin verification failed', 500));
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json(apiResponse.error('Super admin access required', 403));
  }
  next();
};

export default {
  authenticate,
  authorize,
  requireRole,
  requireOneOfRoles,
  optionalAuth,
  isDriver,
  isCompanyAdmin,
  isSuperAdmin,
};
