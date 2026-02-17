import express from 'express';
import { authorize } from '../middleware/auth.js';
import { requireClient } from '../middleware/roles.js';
import InvoiceController from '../controllers/invoiceController.js';

const router = express.Router();
const invoiceController = new InvoiceController();

/**
 * POST /api/invoices/generate/:bookingId
 * Generate invoice for a booking
 */
router.post('/generate/:bookingId', authorize, requireClient, (req, res, next) => {
  invoiceController.generateInvoice(req, res, next);
});

/**
 * GET /api/invoices/pdf/:invoiceId
 * Download invoice as PDF
 */
router.get('/pdf/:invoiceId', authorize, (req, res, next) => {
  invoiceController.getInvoicePDF(req, res, next);
});

/**
 * GET /api/invoices/my
 * Get user's invoices
 */
router.get('/my', authorize, (req, res, next) => {
  invoiceController.getUserInvoices(req, res, next);
});

/**
 * GET /api/invoices/company
 * Get company invoices (Admin only)
 */
router.get('/company', authorize, (req, res, next) => {
  invoiceController.getCompanyInvoices(req, res, next);
});

/**
 * GET /api/invoices
 * Get all invoices (Super admin only)
 */
router.get('/', authorize, (req, res, next) => {
  invoiceController.getAllInvoices(req, res, next);
});

export default router;
