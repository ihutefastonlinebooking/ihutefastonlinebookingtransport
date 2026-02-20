import express from 'express';
import { BookingRequestController } from '../controllers/bookingRequestController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const bookingRequestController = new BookingRequestController();

// Public routes
router.post('/', bookingRequestController.createBookingRequest);

// Protected routes (Admin only)
router.get('/', authenticate, authorize('super_admin', 'company_admin'), bookingRequestController.getBookingRequests);
router.get('/:id', authenticate, authorize('super_admin', 'company_admin'), bookingRequestController.getBookingRequestById);
router.put('/:id/status', authenticate, authorize('super_admin', 'company_admin'), bookingRequestController.updateBookingRequestStatus);
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin'), bookingRequestController.deleteBookingRequest);

export default router;