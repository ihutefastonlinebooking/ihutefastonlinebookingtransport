import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import PDFService from '../services/PDFService.js';

const pdfService = new PDFService();

export class InvoiceController {
  /**
   * Generate invoice for booking
   */
  async generateInvoice(req, res, next) {
    try {
      const { bookingId } = req.params;

      // Get booking details
      const bookingResult = await query(
        `SELECT b.*, r.origin_city, r.destination_city, r.price_per_seat,
                u.first_name, u.last_name, u.email, u.phone,
                c.name as company_name
         FROM bookings b
         JOIN routes r ON b.route_id = r.id
         JOIN users u ON b.user_id = u.id
         JOIN companies c ON r.company_id = c.id
         WHERE b.id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      // Check authorization (owner or admin)
      const booking = bookingResult.rows[0];
      if (booking.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('You cannot access this invoice');
      }

      // Check if invoice already exists
      const invoiceCheckResult = await query(
        'SELECT id FROM invoices WHERE booking_id = $1',
        [bookingId]
      );

      let invoice;
      if (invoiceCheckResult.rows.length > 0) {
        invoice = invoiceCheckResult.rows[0];
      } else {
        // Create new invoice
        const invoiceId = uuidv4();
        const invoiceNumber = `INV-${Date.now()}`;

        const invoiceResult = await query(
          `INSERT INTO invoices (id, booking_id, invoice_number, user_id, company_id, total_amount, tax_amount, discount_amount, status, invoice_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
           RETURNING *`,
          [
            invoiceId,
            bookingId,
            invoiceNumber,
            booking.user_id,
            null, // company_id will be null for now
            booking.total_price,
            Math.round(booking.total_price * 0.18), // 18% tax
            Math.round((booking.total_price * booking.discount_percentage) / 100),
            'issued',
          ]
        );

        invoice = invoiceResult.rows[0];

        await auditLog(req.user.userId, 'INVOICE_GENERATED', 'invoice', invoice.id, null, invoice, 'success');
      }

      res.json(apiResponse.success(invoice, 'Invoice generated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePDF(req, res, next) {
    try {
      const { invoiceId } = req.params;

      // Get invoice with booking details
      const invoiceResult = await query(
        `SELECT i.*, b.*, r.origin_city, r.destination_city, r.price_per_seat,
                u.first_name, u.last_name, u.email, u.phone,
                c.name as company_name
         FROM invoices i
         JOIN bookings b ON i.booking_id = b.id
         JOIN routes r ON b.route_id = r.id
         JOIN users u ON b.user_id = u.id
         JOIN companies c ON r.company_id = c.id
         WHERE i.id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        throw errors.notFound('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Check authorization
      if (invoice.user_id !== req.user.userId && req.user.role !== 'super_admin' && req.user.role !== 'company_admin') {
        throw errors.forbidden('You cannot access this invoice');
      }

      // Generate PDF
      const pdfData = await pdfService.generateInvoicePDF({
        invoiceNumber: invoice.invoice_number,
        invoiceDate: new Date(invoice.invoice_date).toLocaleDateString(),
        bookingReference: invoice.booking_reference,
        customerName: `${invoice.first_name} ${invoice.last_name}`,
        customerEmail: invoice.email,
        customerPhone: invoice.phone,
        originCity: invoice.origin_city,
        destinationCity: invoice.destination_city,
        departureDate: new Date(invoice.departure_date).toLocaleDateString(),
        departureTime: invoice.departure_time,
        numberOfSeats: invoice.number_of_seats,
        pricePerSeat: invoice.price_per_seat,
        subtotal: invoice.total_price - invoice.tax_amount + invoice.discount_amount,
        discountAmount: invoice.discount_amount,
        taxAmount: invoice.tax_amount,
        totalAmount: invoice.total_amount,
        companyName: invoice.company_name,
        notes: 'Thank you for using HuteFast!',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
      res.send(pdfData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user invoices
   */
  async getUserInvoices(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT i.* FROM invoices i
         WHERE i.user_id = $1
         ORDER BY i.invoice_date DESC
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) FROM invoices WHERE user_id = $1',
        [req.user.userId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company invoices (Admin only)
   */
  async getCompanyInvoices(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // This endpoint should only be called by company admins
      const result = await query(
        `SELECT i.* FROM invoices i
         WHERE i.company_id = $1
         ORDER BY i.invoice_date DESC
         LIMIT $2 OFFSET $3`,
        [req.company.id, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) FROM invoices WHERE company_id = $1',
        [req.company.id]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all invoices (Super admin only)
   */
  async getAllInvoices(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT i.*, b.booking_reference, u.first_name, u.last_name
         FROM invoices i
         JOIN bookings b ON i.booking_id = b.id
         JOIN users u ON i.user_id = u.id
         ORDER BY i.invoice_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await query('SELECT COUNT(*) FROM invoices');

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }
}

export default InvoiceController;
