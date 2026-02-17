import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import PaymentController from '../controllers/paymentController.js';

const router = express.Router();
const paymentController = new PaymentController();

// All payment routes require authentication
router.use(authenticate);

router.post('/initiate', asyncHandler((req, res, next) => paymentController.initiatePayment(req, res, next)));
router.post('/verify', asyncHandler((req, res, next) => paymentController.verifyPayment(req, res, next)));
router.get('/', asyncHandler((req, res, next) => paymentController.getPaymentHistory(req, res, next)));
router.get('/:paymentId', asyncHandler((req, res, next) => paymentController.getPaymentStatus(req, res, next)));
router.post('/:paymentId/refund', asyncHandler((req, res, next) => paymentController.refundPayment(req, res, next)));

export default router;
