import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import QRValidationController from '../controllers/qrValidationController.js';

const router = express.Router();
const qrValidationController = new QRValidationController();

// Public routes (for scanning at validation points)
router.post('/validate', asyncHandler((req, res, next) => qrValidationController.validateQRCode(req, res, next)));

// Protected routes
router.get('/my-validations', authenticate, asyncHandler((req, res, next) => qrValidationController.getUserValidations(req, res, next)));
router.get('/:qrId/details', authenticate, asyncHandler((req, res, next) => qrValidationController.getQRDetails(req, res, next)));
router.post('/:qrId/verify', authenticate, asyncHandler((req, res, next) => qrValidationController.verifyQRCode(req, res, next)));

export default router;
