import { query } from '../db/connection.js';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/crypto.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { validate, userValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import EmailService from '../services/EmailService.js';

const emailService = new EmailService();

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, role } = validate(
        userValidationSchemas.register,
        req.body
      );

      // Check if user exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw errors.conflict('Email already registered', { email: 'This email is already in use' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, role, first_name, last_name`,
        [email, hashedPassword, firstName, lastName, phone, role, 'active']
      );

      const user = result.rows[0];

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, firstName);
      } catch (error) {
        console.error('Welcome email error:', error);
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, role);
      const refreshToken = generateRefreshToken(user.id);

      // Audit log
      await auditLog(user.id, 'USER_REGISTERED', 'user', user.id, null, user, 'success');

      res.status(201).json(apiResponse.success(
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        'Registration successful',
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = validate(userValidationSchemas.login, req.body);

      // Find user
      const result = await query(
        'SELECT id, email, password_hash, role, status, first_name, last_name FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw errors.unauthorized('Invalid credentials');
      }

      const user = result.rows[0];

      // Check account status
      if (user.status === 'blocked') {
        throw errors.forbidden('Your account has been blocked');
      }

      if (user.status === 'inactive') {
        throw errors.forbidden('Your account is inactive');
      }

      // Verify password
      const passwordValid = await comparePassword(password, user.password_hash);
      if (!passwordValid) {
        throw errors.unauthorized('Invalid credentials');
      }

      // Update last login
      await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token
      const hashedRefreshToken = await hashPassword(refreshToken);
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

      await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, hashedRefreshToken, refreshTokenExpiry]
      );

      // Audit log
      await auditLog(user.id, 'USER_LOGIN', 'user', user.id, null, null, 'success');

      res.json(apiResponse.success(
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        'Login successful'
      ));
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken: token } = req.body;

      if (!token) {
        throw errors.badRequest('Refresh token is required');
      }

      // Verify token
      const decoded = require('../utils/jwt.js').verifyRefreshToken(token);

      // Get user
      const result = await query('SELECT id, role, status FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length === 0) {
        throw errors.unauthorized('User not found');
      }

      const user = result.rows[0];

      if (user.status !== 'active') {
        throw errors.forbidden('User account is not active');
      }

      // Verify refresh token exists and matches stored hash
      const tokenRow = await query(
        'SELECT token_hash, expires_at FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.id]
      );

      if (tokenRow.rows.length === 0) {
        throw errors.unauthorized('Refresh token not found');
      }

      const { token_hash: tokenHash, expires_at: expiresAt } = tokenRow.rows[0];
      if (!expiresAt || new Date() > expiresAt) {
        throw errors.unauthorized('Refresh token expired');
      }

      const { comparePassword } = require('../utils/crypto.js');
      const valid = await comparePassword(token, tokenHash);
      if (!valid) {
        throw errors.unauthorized('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.role);

      res.json(apiResponse.success(
        { accessToken },
        'Token refreshed'
      ));
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Revoke all refresh tokens for this user
      try {
        await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.userId]);
      } catch (err) {
        console.error('Failed to revoke refresh tokens during logout', err);
      }

      await auditLog(req.user.userId, 'USER_LOGOUT', 'user', req.user.userId, null, null, 'success');

      res.json(apiResponse.success(null, 'Logout successful'));
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const result = await query(
        'SELECT id, email, first_name, last_name, phone, role, status, created_at FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('User not found');
      }

      const user = result.rows[0];

      res.json(apiResponse.success(
        {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          createdAt: user.created_at,
        },
        'User retrieved'
      ));
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw errors.badRequest('Email is required');
      }

      const result = await query('SELECT id, email, first_name FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        // Don't reveal if email exists
        return res.json(apiResponse.success(null, 'If email exists, reset link will be sent'));
      }

      const user = result.rows[0];
      const resetToken = generateRandomToken();
      const resetTokenHash = await hashPassword(resetToken);
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      // Store reset token (in production, use a separate table)
      await query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [resetTokenHash, resetTokenExpiry, user.id]
      );

      // Send reset email
      try {
        const resetLink = `${req.headers.origin}/reset-password?token=${resetToken}&email=${email}`;
        await emailService.sendPasswordResetEmail(email, resetLink);
      } catch (error) {
        console.error('Password reset email error:', error);
      }

      await auditLog(user.id, 'PASSWORD_RESET_REQUESTED', 'user', user.id, null, null, 'success');

      res.json(apiResponse.success(null, 'If email exists, reset link will be sent'));
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        throw errors.badRequest('Email, token, and new password are required');
      }

      // Find user
      const result = await query('SELECT id, password_reset_expires FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        throw errors.notFound('User not found');
      }

      const user = result.rows[0];

      // Check expiration
      if (!user.password_reset_expires || new Date() > user.password_reset_expires) {
        throw errors.badRequest('Password reset token has expired');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
        [hashedPassword, user.id]
      );

      await auditLog(user.id, 'PASSWORD_RESET', 'user', user.id, null, null, 'success');

      res.json(apiResponse.success(null, 'Password reset successful'));
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
