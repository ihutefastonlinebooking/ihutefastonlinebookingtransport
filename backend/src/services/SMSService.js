import twilio from 'twilio';
import config from '../config/index.js';

export class SMSService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.phoneNumber = config.twilio.phoneNumber;
  }

  async sendSMS(toPhone, message) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: toPhone,
      });

      return {
        success: true,
        messageSid: response.sid,
        status: response.status,
      };
    } catch (error) {
      console.error('SMS error:', error.message);
      throw new Error('Failed to send SMS');
    }
  }

  async sendBookingConfirmation(phone, bookingRef, totalPrice, departureTime) {
    const message = `HuteFast Booking Confirmed!\nBooking Ref: ${bookingRef}\nAmount: RWF ${totalPrice}\nDeparture: ${departureTime}\nDownload ticket: ${config.frontend.url}/ticket/${bookingRef}`;
    return this.sendSMS(phone, message);
  }

  async sendPaymentConfirmation(phone, amount, bookingRef) {
    const message = `HuteFast Payment Confirmed!\nAmount: RWF ${amount}\nBooking Ref: ${bookingRef}\nThank you!`;
    return this.sendSMS(phone, message);
  }

  async sendTicketReminder(phone, bookingRef, departureTime) {
    const message = `HuteFast: Your trip ${bookingRef} departs in 30 minutes at ${departureTime}. Please be ready!`;
    return this.sendSMS(phone, message);
  }

  async sendDriverNotification(phone, bookingRef, passengerCount) {
    const message = `HuteFast: New booking ${bookingRef} with ${passengerCount} passenger(s). Accept to proceed.`;
    return this.sendSMS(phone, message);
  }

  async sendCancellationConfirmation(phone, bookingRef, refundAmount) {
    const message = `HuteFast: Booking ${bookingRef} cancelled. Refund: RWF ${refundAmount} will be processed within 24 hours.`;
    return this.sendSMS(phone, message);
  }
}

export default SMSService;
