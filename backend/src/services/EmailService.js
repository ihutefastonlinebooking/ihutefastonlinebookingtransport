import nodemailer from 'nodemailer';
import config from '../config/index.js';

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.email.service,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: `HuteFast <${config.email.user}>`,
        to,
        subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Email error:', error.message);
      throw new Error('Failed to send email');
    }
  }

  async sendBookingConfirmation(email, bookingData) {
    const html = `
      <h2>Booking Confirmation - HuteFast</h2>
      <p>Dear ${bookingData.passengerName},</p>
      <p>Your booking has been confirmed!</p>
      <hr>
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Booking Reference:</strong> ${bookingData.bookingReference}</li>
        <li><strong>From:</strong> ${bookingData.originCity}</li>
        <li><strong>To:</strong> ${bookingData.destinationCity}</li>
        <li><strong>Date:</strong> ${bookingData.departureDate}</li>
        <li><strong>Time:</strong> ${bookingData.departureTime}</li>
        <li><strong>Seats:</strong> ${bookingData.numberOfSeats}</li>
        <li><strong>Total Amount:</strong> RWF ${bookingData.totalAmount}</li>
      </ul>
      <hr>
      <p>Your ticket QR code is attached. Please download and save it.</p>
      <p>Remember to arrive 15 minutes before departure!</p>
      <p>Thank you for using HuteFast!</p>
    `;

    return this.sendEmail(email, 'Booking Confirmation - HuteFast', html);
  }

  async sendPaymentReceipt(email, paymentData) {
    const html = `
      <h2>Payment Receipt - HuteFast</h2>
      <p>Dear ${paymentData.customerName},</p>
      <p>Your payment has been received successfully!</p>
      <hr>
      <h3>Payment Details:</h3>
      <ul>
        <li><strong>Transaction ID:</strong> ${paymentData.transactionId}</li>
        <li><strong>Amount:</strong> RWF ${paymentData.amount}</li>
        <li><strong>Payment Method:</strong> ${paymentData.paymentMethod}</li>
        <li><strong>Date:</strong> ${paymentData.date}</li>
      </ul>
      <hr>
      <p>Thank you for your payment!</p>
    `;

    return this.sendEmail(email, 'Payment Receipt - HuteFast', html);
  }

  async sendWelcomeEmail(email, userName) {
    const html = `
      <h2>Welcome to HuteFast!</h2>
      <p>Dear ${userName},</p>
      <p>Welcome to HuteFast - Your Smart Transport Booking Platform!</p>
      <p>We're excited to have you on board. Here's what you can do:</p>
      <ul>
        <li>Book long-distance trips across the country</li>
        <li>Quick short-distance city rides</li>
        <li>Use your iHute Card for faster bookings</li>
        <li>Track your driver in real-time</li>
        <li>Get instant SMS confirmations</li>
      </ul>
      <p><a href="${config.frontend.url}/login">Get Started</a></p>
      <hr>
      <p>Questions? Contact us at info@hutefast.com</p>
    `;

    return this.sendEmail(email, 'Welcome to HuteFast!', html);
  }

  async sendPasswordResetEmail(email, resetLink) {
    const html = `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail(email, 'Password Reset - HuteFast', html);
  }

  async sendEmailVerification(email, verificationLink) {
    const html = `
      <h2>Verify Your Email</h2>
      <p>Thank you for signing up with HuteFast!</p>
      <p>Please verify your email address to activate your account:</p>
      <p><a href="${verificationLink}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
    `;

    return this.sendEmail(email, 'Email Verification - HuteFast', html);
  }

  async sendBookingCancellation(email, cancellationData) {
    const html = `
      <h2>Booking Cancellation Confirmation</h2>
      <p>Dear ${cancellationData.passengerName},</p>
      <p>Your booking has been cancelled successfully.</p>
      <hr>
      <h3>Cancellation Details:</h3>
      <ul>
        <li><strong>Booking Reference:</strong> ${cancellationData.bookingReference}</li>
        <li><strong>Refund Amount:</strong> RWF ${cancellationData.refundAmount}</li>
        <li><strong>Cancellation Date:</strong> ${cancellationData.cancellationDate}</li>
      </ul>
      <hr>
      <p>You will receive your refund within 24-48 hours.</p>
      <p>Thank you for using HuteFast!</p>
    `;

    return this.sendEmail(email, 'Booking Cancellation - HuteFast', html);
  }

  async sendDriverAssignment(email, driverData) {
    const html = `
      <h2>Your Driver is Assigned</h2>
      <p>Your driver has been assigned for your trip!</p>
      <hr>
      <h3>Driver Information:</h3>
      <ul>
        <li><strong>Name:</strong> ${driverData.driverName}</li>
        <li><strong>Phone:</strong> ${driverData.driverPhone}</li>
        <li><strong>Rating:</strong> ${driverData.driverRating}/5</li>
        <li><strong>Vehicle:</strong> ${driverData.vehicleInfo}</li>
        <li><strong>License Plate:</strong> ${driverData.vehicleLicensePlate}</li>
      </ul>
      <hr>
      <p>You will be able to track your driver on the app starting 30 minutes before departure.</p>
    `;

    return this.sendEmail(email, 'Driver Assignment - HuteFast', html);
  }
}

export default EmailService;
