import { query } from '../db/connection.js';

export const auditLog = async (userId, action, entityType, entityId, oldValues = null, newValues = null, status = 'success', errorMessage = null) => {
  try {
    await query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, old_values, new_values, status, error_message, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        status,
        errorMessage,
        null, // ip_address - can be added from request
        null, // user_agent - can be added from request
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const auditLogMiddleware = (req, res, next) => {
  // Store original body for audit purposes
  res.on('finish', async () => {
    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      // Only log successful operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        try {
          await auditLog(
            req.user.userId,
            `${req.method} ${req.path}`,
            null,
            null,
            null,
            null,
            'success'
          );
        } catch (error) {
          console.error('Audit middleware error:', error);
        }
      }
    }
  });
  next();
};

export default {
  auditLog,
  auditLogMiddleware,
};
