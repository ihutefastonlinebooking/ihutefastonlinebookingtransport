import express from 'express';
import { authenticate, isDriver } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import DriverController from '../controllers/driverController.js';

const router = express.Router();
const driverController = new DriverController();

// Registration is available to authenticated users
router.post('/register', authenticate, asyncHandler((req, res, next) => driverController.registerDriver(req, res, next)));

// All other driver routes require authentication and driver verification
router.use(authenticate);
router.use(isDriver);

router.get('/profile', asyncHandler((req, res, next) => driverController.getDriverProfile(req, res, next)));
router.put('/status', asyncHandler((req, res, next) => driverController.updateDriverStatus(req, res, next)));
router.get('/trips/today', asyncHandler((req, res, next) => driverController.getTodayTrips(req, res, next)));
router.get('/stats', asyncHandler((req, res, next) => driverController.getDriverStats(req, res, next)));
router.post('/location', asyncHandler((req, res, next) => driverController.shareLocation(req, res, next)));
router.get('/reviews', asyncHandler((req, res, next) => driverController.getReviews(req, res, next)));

export default router;
