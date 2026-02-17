import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ShortTripController } from '../controllers/shortTripController.js';

const router = express.Router();
const shortTripController = new ShortTripController();

// Public routes
router.post('/search', asyncHandler((req, res, next) => shortTripController.searchShortTrips(req, res, next)));

// Protected routes
router.post('/book', authenticate, asyncHandler((req, res, next) => shortTripController.bookShortTrip(req, res, next)));
router.get('/bookings/:bookingId', authenticate, asyncHandler((req, res, next) => shortTripController.getBooking(req, res, next)));
router.get('/my-bookings', authenticate, asyncHandler((req, res, next) => shortTripController.getUserBookings(req, res, next)));
router.delete('/bookings/:bookingId/cancel', authenticate, asyncHandler((req, res, next) => shortTripController.cancelBooking(req, res, next)));

export default router;
