import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import UserController from '../controllers/userController.js';

const router = express.Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

router.put('/profile', asyncHandler((req, res, next) => userController.updateProfile(req, res, next)));
router.get('/me', asyncHandler((req, res, next) => userController.getUserById(req, res, next)));
router.post('/change-password', asyncHandler((req, res, next) => userController.changePassword(req, res, next)));
router.get('/stats', asyncHandler((req, res, next) => userController.getUserStats(req, res, next)));
router.delete('/account', asyncHandler((req, res, next) => userController.deleteAccount(req, res, next)));

export default router;
