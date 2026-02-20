import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import BookingController from '../controllers/bookingController.js';

const router = express.Router();
const bookingController = new BookingController();

// All booking routes require authentication
router.use(authenticate);

router.post('/search', asyncHandler((req, res, next) => bookingController.searchRoutes(req, res, next)));
router.post('/', asyncHandler((req, res, next) => bookingController.createBooking(req, res, next)));
router.get('/', asyncHandler((req, res, next) => bookingController.getUserBookings(req, res, next)));
router.get('/:bookingId', asyncHandler((req, res, next) => bookingController.getBooking(req, res, next)));
router.delete('/:bookingId', asyncHandler((req, res, next) => bookingController.cancelBooking(req, res, next)));

export default router;
