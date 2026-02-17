import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AdminController } from '../controllers/adminController.js';

const router = express.Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use((req, res, next) => authorize('super_admin', 'company_admin')(req, res, next));

// Company Management
router.get('/companies', asyncHandler((req, res, next) => adminController.getAllCompanies(req, res, next)));
router.put('/companies/:companyId/approve', asyncHandler((req, res, next) => adminController.approveCompany(req, res, next)));
router.put('/companies/:companyId/reject', asyncHandler((req, res, next) => adminController.rejectCompany(req, res, next)));
router.get('/companies/:companyId', asyncHandler((req, res, next) => adminController.getCompanyDetails(req, res, next)));

// Driver Management
router.get('/drivers', asyncHandler((req, res, next) => adminController.getAllDrivers(req, res, next)));
router.put('/drivers/:driverId/approve', asyncHandler((req, res, next) => adminController.approveDriver(req, res, next)));
router.put('/drivers/:driverId/suspend', asyncHandler((req, res, next) => adminController.suspendDriver(req, res, next)));

// Analytics
router.get('/analytics/overview', asyncHandler((req, res, next) => adminController.getAnalyticsOverview(req, res, next)));
router.get('/analytics/revenue', asyncHandler((req, res, next) => adminController.getRevenueAnalytics(req, res, next)));

// Audit logs
router.get('/audit-logs', asyncHandler((req, res, next) => adminController.getAuditLogs(req, res, next)));

export default router;
