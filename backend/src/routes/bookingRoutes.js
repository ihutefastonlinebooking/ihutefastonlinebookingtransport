import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import BookingController from '../controllers/bookingController.js';

const router = express.Router();
const bookingController = new BookingController();

// Public search routes
router.get('/search', asyncHandler((req, res, next) => bookingController.searchRoutes(req, res, next)));

// Authenticated routes
router.use(authenticate);

// Check availability
router.get('/availability', asyncHandler((req, res, next) => bookingController.checkAvailability(req, res, next)));

// User booking operations
router.post('/', asyncHandler((req, res, next) => bookingController.createBooking(req, res, next)));
router.get('/', asyncHandler((req, res, next) => bookingController.getUserBookings(req, res, next)));
router.get('/:bookingId', asyncHandler((req, res, next) => bookingController.getBooking(req, res, next)));
router.delete('/:bookingId', asyncHandler((req, res, next) => bookingController.cancelBooking(req, res, next)));

// Admin routes
router.get('/admin/all', authorize('super_admin', 'company_admin'), asyncHandler((req, res, next) => bookingController.getAllBookings(req, res, next)));
router.put('/:bookingId/status', authorize('super_admin', 'company_admin'), asyncHandler((req, res, next) => bookingController.updateBookingStatus(req, res, next)));
router.put('/:bookingId/payment-status', authorize('super_admin', 'company_admin'), asyncHandler((req, res, next) => bookingController.updatePaymentStatus(req, res, next)));
router.put('/:bookingId', authorize('super_admin', 'company_admin'), asyncHandler((req, res, next) => bookingController.editBooking(req, res, next)));
router.delete('/:bookingId/admin', authorize('super_admin', 'company_admin'), asyncHandler((req, res, next) => bookingController.deleteBooking(req, res, next)));

export default router;
