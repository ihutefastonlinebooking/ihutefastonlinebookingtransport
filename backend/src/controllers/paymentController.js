import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, paymentValidationSchemas } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import MoMoPaymentService from '../services/MoMoPaymentService.js';
import SMSService from '../services/SMSService.js';
import EmailService from '../services/EmailService.js';
import QRCodeService from '../services/QRCodeService.js';

const momoService = new MoMoPaymentService();
const smsService = new SMSService();
const emailService = new EmailService();
const qrService = new QRCodeService();

export class PaymentController {
  async initiatePayment(req, res, next) {
    try {
      const validatedData = validate(paymentValidationSchemas.createMoMoPayment, req.body);

      // Get booking details
      const bookingResult = await query(
        'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
        [validatedData.bookingId, req.user.userId]
      );

      if (bookingResult.rows.length === 0) {
        throw errors.notFound('Booking not found');
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== 'pending') {
        throw errors.badRequest('Booking is not pending');
      }

      // Check expiry
      if (new Date() > new Date(booking.expiry_at)) {
        throw errors.badRequest('Booking has expired');
      }

      // Initiate MoMo payment
      const phone = await momoService.validatePhoneNumber(validatedData.phone);
      const paymentResult = await momoService.initiatePayment(phone, validatedData.amount, booking.id);

      // Create payment record
      const paymentRecord = await query(
        `INSERT INTO payments (user_id, booking_id, amount, payment_method, status, transaction_id, momo_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.user.userId,
          validatedData.bookingId,
          validatedData.amount,
          'momo',
          'pending',
          paymentResult.transactionId,
          paymentResult.transactionId,
        ]
      );

      await auditLog(req.user.userId, 'PAYMENT_INITIATED', 'payment', paymentRecord.rows[0].id, null, paymentRecord.rows[0], 'success');

      res.json(apiResponse.success(
        {
          paymentId: paymentRecord.rows[0].id,
          transactionId: paymentResult.transactionId,
          amount: validatedData.amount,
          status: 'pending',
          message: 'Please wait for MoMo prompt on your phone',
        },
        'Payment initiated successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const { transactionId, bookingId } = req.body;

      if (!transactionId || !bookingId) {
        throw errors.badRequest('Transaction ID and booking ID are required');
      }

      // Check payment status with MoMo
      const paymentStatus = await momoService.checkPaymentStatus(transactionId);

      if (paymentStatus.status === 'SUCCESSFUL') {
        // Update booking status
        const bookingResult = await query(
          'UPDATE bookings SET status = $1, payment_status = $2, paid_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
          ['confirmed', 'paid', bookingId]
        );

        if (bookingResult.rows.length === 0) {
          throw errors.notFound('Booking not found');
        }

        // Update payment record
        await query(
          'UPDATE payments SET status = $1 WHERE transaction_id = $2',
          ['completed', transactionId]
        );

        const booking = bookingResult.rows[0];

        // Generate invoice
        const invoiceId = uuidv4();
        const invoiceNumber = `INV-${Date.now()}`;

        await query(
          `INSERT INTO invoices (id, booking_id, invoice_number, user_id, total_amount, tax_amount, discount_amount, status, invoice_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)`,
          [
            invoiceId,
            bookingId,
            invoiceNumber,
            booking.user_id,
            booking.total_price,
            Math.round(booking.total_price * 0.18), // 18% tax
            Math.round((booking.total_price * (booking.discount_percentage || 0)) / 100),
            'issued',
          ]
        );

        // Generate QR ticket
        const qrData = {
          bookingId: booking.id,
          userId: booking.user_id,
          routeId: booking.route_id,
          seats: booking.seats,
          totalPrice: booking.total_price,
          timestamp: new Date().toISOString(),
        };

        const qrCode = await qrService.generateQRCode(qrData);

        await query(
          'UPDATE bookings SET qr_code = $1 WHERE id = $2',
          [qrCode, bookingId]
        );

        // Get user details for notifications
        const userResult = await query(
          'SELECT email, phone, first_name FROM users WHERE id = $1',
          [booking.user_id]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          
          // Send SMS confirmation
          try {
            await smsService.sendPaymentConfirmation(user.phone, booking.total_price, booking.booking_reference);
          } catch (error) {
            console.error('SMS error:', error);
          }

          // Send email confirmation
          try {
            await emailService.sendPaymentReceipt(user.email, {
              customerName: user.first_name,
              transactionId: transactionId,
              amount: booking.total_price,
              paymentMethod: 'MoMo',
              date: new Date().toLocaleString(),
            });
          } catch (error) {
            console.error('Email error:', error);
          }
        }

        await auditLog(req.user.userId, 'PAYMENT_VERIFIED', 'payment', bookingId, null, { status: 'completed' }, 'success');

        res.json(apiResponse.success(
          {
            bookingId: bookingId,
            status: 'confirmed',
            paymentStatus: 'completed',
            amount: booking.total_price,
          },
          'Payment verified successfully'
        ));
      } else if (paymentStatus.status === 'PENDING') {
        res.json(apiResponse.success(
          { status: 'pending' },
          'Payment is still pending'
        ));
      } else {
        throw errors.badRequest('Payment failed');
      }
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req, res, next) {
    try {
      const { paymentId } = req.params;

      const result = await query(
        'SELECT * FROM payments WHERE id = $1',
        [paymentId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Payment not found');
      }

      res.json(apiResponse.success(result.rows[0], 'Payment retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user.userId, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) FROM payments WHERE user_id = $1',
        [req.user.userId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req, res, next) {
    try {
      const { paymentId } = req.params;

      const result = await query(
        'SELECT * FROM payments WHERE id = $1',
        [paymentId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Payment not found');
      }

      const payment = result.rows[0];

      if (payment.status !== 'completed') {
        throw errors.badRequest('Only completed payments can be refunded');
      }

      // Update payment status
      await query(
        'UPDATE payments SET status = $1 WHERE id = $2',
        ['refunded', paymentId]
      );

      await auditLog(req.user.userId, 'PAYMENT_REFUNDED', 'payment', paymentId, payment, { status: 'refunded' }, 'success');

      res.json(apiResponse.success(
        { refundStatus: 'initiated' },
        'Refund initiated successfully'
      ));
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentController;
