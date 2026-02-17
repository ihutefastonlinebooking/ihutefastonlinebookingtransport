import axios from 'axios';
import config from '../config/index.js';

export class MoMoPaymentService {
  constructor() {
    this.apiKey = config.momo.apiKey;
    this.apiSecret = config.momo.apiSecret;
    this.apiUrl = config.momo.apiUrl;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'X-Reference-Id': this.generateReferenceId(),
        'Authorization': `Bearer ${this.getAccessToken()}`,
        'Content-Type': 'application/json',
        'X-Target-Environment': 'sandbox',
      },
    });
  }

  generateReferenceId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getAccessToken() {
    // In production, implement OAuth2 flow to get access token
    return this.apiSecret;
  }

  async initiatePayment(phoneNumber, amount, bookingId) {
    try {
      const response = await this.client.post('/v1_0/requesttopay', {
        externalId: bookingId,
        amount: amount.toString(),
        currency: 'RWF',
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: `HuteFast Transport Booking - ${bookingId}`,
        payeeNote: 'Transport Booking Payment',
      });

      return {
        success: true,
        transactionId: response.headers['x-reference-id'],
        message: 'Payment initiated successfully',
      };
    } catch (error) {
      console.error('MoMo error:', error.response?.data || error.message);
      throw new Error('Payment initiation failed');
    }
  }

  async checkPaymentStatus(transactionId) {
    try {
      const response = await this.client.get(`/v1_0/requesttopay/${transactionId}`);

      return {
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        payer: response.data.payer,
      };
    } catch (error) {
      console.error('Payment status check error:', error.response?.data || error.message);
      throw new Error('Failed to check payment status');
    }
  }

  async validatePhoneNumber(phoneNumber) {
    // Add country code if missing
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+250' + phoneNumber.replace(/^0/, '');
    }
    return phoneNumber;
  }
}

export default MoMoPaymentService;
