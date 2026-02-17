import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import AuthController from '../controllers/authController.js';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', asyncHandler((req, res, next) => authController.register(req, res, next)));
router.post('/login', asyncHandler((req, res, next) => authController.login(req, res, next)));
router.post('/refresh', asyncHandler((req, res, next) => authController.refreshToken(req, res, next)));
router.post('/password-reset-request', asyncHandler((req, res, next) => authController.requestPasswordReset(req, res, next)));
router.post('/password-reset', asyncHandler((req, res, next) => authController.resetPassword(req, res, next)));

// Protected routes
router.post('/logout', authenticate, asyncHandler((req, res, next) => authController.logout(req, res, next)));
router.get('/me', authenticate, asyncHandler((req, res, next) => authController.getCurrentUser(req, res, next)));

export default router;
